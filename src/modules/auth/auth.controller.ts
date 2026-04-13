import {
  Controller,
  Post,
  Req,
  Res,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { Request, Response, CookieOptions } from 'express';
import { Public } from './decorators/public.decorator';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private refreshCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      // Scoped to /api/auth so the browser sends the cookie to /refresh and
      // /logout (both rely on it). A narrower path would leave /logout
      // unable to receive the cookie in any standard browser flow.
      path: '/api/auth',
    };
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, {
      ...this.refreshCookieOptions(),
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    });
  }

  /**
   * Authenticate a user with email + password, issue an access token and
   * a fresh refresh token (cookie).
   */
  @Public()
  @Post('login')
  @HttpCode(200)
  // Note: @Res() bypasses the global ClassSerializerInterceptor, so the
  // @Exclude() decorators on User fields are NOT enforced on this response.
  // Only send hand-crafted payloads here — never return a User entity.
  async login(@Body() body: LoginDto, @Res() res: Response) {
    const user = await this.authService.validateUser(body.email, body.password);
    const userId = user.id.toString();
    const accessToken = await this.authService.generateAccessToken(userId);
    const refreshToken =
      await this.authService.issueInitialRefreshToken(userId);

    this.setRefreshCookie(res, refreshToken);
    return res.json({ access_token: accessToken });
  }

  /**
   * Exchange a valid refresh token for a new access token. Rotates the
   * refresh token atomically — the presented token is invalidated and a new
   * one (with a bumped version) is issued. Concurrent rotations for the
   * same token surface as 401 rather than silently dropping a session.
   */
  @Public()
  @Post('refresh')
  @HttpCode(200)
  @UseGuards(JwtRefreshGuard)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const { userId, version } = req.user as {
      userId: string;
      version: number;
    };
    const newAccessToken = await this.authService.generateAccessToken(userId);
    const refreshToken = await this.authService.rotateRefreshToken(
      userId,
      version,
    );

    this.setRefreshCookie(res, refreshToken);
    return res.json({ access_token: newAccessToken });
  }

  /**
   * Server-side revocation of the caller's refresh token + cookie clear.
   * Authenticated via the refresh-token cookie (not the access token) so
   * a user whose access token has already expired can still log out.
   */
  @Public()
  @Post('logout')
  @HttpCode(204)
  @UseGuards(JwtRefreshGuard)
  async logout(@Req() req: Request, @Res() res: Response) {
    const { userId } = req.user as { userId: string };
    await this.authService.clearRefreshToken(userId);
    // Path must match the attributes used when setting the cookie or the
    // browser will ignore the clear directive (RFC 6265).
    res.clearCookie(REFRESH_COOKIE, this.refreshCookieOptions());
    return res.status(204).end();
  }

  /**
   * Create a new user.
   */
  @Public()
  @Post('signup')
  @HttpCode(201)
  async signUp(@Body() body: SignUpDto) {
    await this.authService.createNewUser(body);
    return { message: 'User created successfully' };
  }
}
