import {
  Inject,
  Injectable,
  ConflictException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHmac, timingSafeEqual } from 'crypto';
import { User } from '../database/entities/user';
import { SignUpDto } from './dto/signup.dto';

// Real bcrypt hash of a value that is never a valid password. Used by
// validateUser to keep the "user not found" and "wrong password" paths
// indistinguishable in wall-clock time, preventing email enumeration via
// response-time side channel.
const DUMMY_BCRYPT_HASH =
  '$2b$10$CwTycUXWue0Thq9StjUM0uJ8r0g6n9N2qNf5BFfQJ8Qz5kz1lO6FC';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshSecret: string;

  constructor(
    @Inject('USERS_REPOSITORY')
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Cache at boot: fail fast if missing, and avoid `string | undefined`
    // reaching createHmac (which silently accepts undefined → weakened HMAC).
    this.refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  async generateAccessToken(userId: string): Promise<string> {
    const payload = { sub: userId };
    return this.jwtService.signAsync(payload);
  }

  async createNewUser(data: SignUpDto): Promise<Partial<User>> {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    const user = this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    // Return sanitized user (no password)
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });

    // Always run bcrypt.compare, even when the user is not found, so the
    // response time does not reveal whether the email is registered.
    const isPasswordValid = await bcrypt.compare(
      password,
      user?.password ?? DUMMY_BCRYPT_HASH,
    );

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async findUserById(userId: string): Promise<User | null> {
    const id = this.parseUserId(userId);
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * Issues a fresh refresh token at login. Bumps the user's token version and
   * persists the HMAC of the new token. Uses an optimistic version check so
   * concurrent issuance for the same user surfaces as an error rather than
   * silently clobbering one of the sessions.
   */
  async issueInitialRefreshToken(userId: string): Promise<string> {
    const id = this.parseUserId(userId);
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'refreshTokenVersion'],
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.issueAndPersist(userId, id, user.refreshTokenVersion);
  }

  /**
   * Rotates the refresh token. The caller must pass the version embedded in
   * the presented (and already-validated) JWT; the UPDATE only succeeds if
   * that version is still current, which makes concurrent rotation safe —
   * exactly one caller succeeds, the loser gets 401.
   */
  async rotateRefreshToken(
    userId: string,
    presentedVersion: number,
  ): Promise<string> {
    const id = this.parseUserId(userId);
    return this.issueAndPersist(userId, id, presentedVersion);
  }

  private async issueAndPersist(
    userId: string,
    id: number,
    expectedVersion: number,
  ): Promise<string> {
    const newVersion = expectedVersion + 1;
    const token = await this.jwtService.signAsync(
      { sub: userId, ver: newVersion },
      {
        secret: this.refreshSecret,
        expiresIn: '7d',
      },
    );
    const hash = this.hashRefreshToken(token);

    const result = await this.userRepository.update(
      { id, refreshTokenVersion: expectedVersion },
      { refreshTokenHash: hash, refreshTokenVersion: newVersion },
    );
    if (!result.affected) {
      // Either the user disappeared or another concurrent request rotated
      // the version out from under us. Either way, the caller's token is
      // no longer authoritative.
      throw new UnauthorizedException('Refresh token already rotated');
    }
    return token;
  }

  /**
   * Invalidates any outstanding refresh token for this user (logout, or
   * server-side revocation after reuse detection).
   */
  async clearRefreshToken(userId: string): Promise<void> {
    const id = this.parseUserId(userId);
    await this.userRepository.update({ id }, { refreshTokenHash: null });
  }

  /**
   * Verifies a presented refresh token against the stored hash and version.
   *
   * Reuse detection: if the presented token's version is older than the
   * user's current version, the token was rotated out — the entire family
   * is revoked and the call fails. This is the mitigation for stolen
   * refresh tokens in a rotation scheme (RFC 6749 §10.4, OAuth 2.0 BCP).
   */
  async validateRefreshToken(
    userId: string,
    refreshToken: string,
    presentedVersion: number,
  ): Promise<void> {
    const user = await this.findUserById(userId);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (presentedVersion < user.refreshTokenVersion) {
      this.logger.warn(
        `Refresh token reuse detected for user ${userId} (presented v${presentedVersion}, current v${user.refreshTokenVersion}) — revoking family`,
      );
      await this.clearRefreshToken(userId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    if (presentedVersion !== user.refreshTokenVersion) {
      // Presented a future-version token we never issued. Not reuse, but
      // definitely not legitimate.
      throw new UnauthorizedException('Invalid refresh token');
    }
    const presented = this.hashRefreshToken(refreshToken);
    if (!this.safeCompareHex(presented, user.refreshTokenHash)) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * HMAC-SHA256 fingerprint of the refresh token. Safe because the input is
   * a high-entropy signed JWT — we do not need bcrypt's adaptive slowness,
   * which would add ~100ms CPU to every /auth/refresh call.
   */
  private hashRefreshToken(token: string): string {
    return createHmac('sha256', this.refreshSecret).update(token).digest('hex');
  }

  private safeCompareHex(a: string, b: string): boolean {
    const ab = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    if (ab.length === 0 || ab.length !== bb.length) {
      return false;
    }
    return timingSafeEqual(
      ab as unknown as Uint8Array,
      bb as unknown as Uint8Array,
    );
  }

  private parseUserId(userId: string): number {
    // Positive integer with no leading zeros — this single regex replaces the
    // previous regex + `id <= 0` guard combo (they overlapped).
    if (typeof userId !== 'string' || !/^[1-9]\d*$/.test(userId)) {
      throw new UnauthorizedException('Invalid user identifier');
    }
    const id = parseInt(userId, 10);
    if (!Number.isInteger(id)) {
      throw new UnauthorizedException('Invalid user identifier');
    }
    return id;
  }
}
