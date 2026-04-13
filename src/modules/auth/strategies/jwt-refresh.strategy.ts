import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './jwt.strategy';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refresh_token,
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      // Explicit: expired refresh tokens must be rejected. (Passport's
      // default is already false, but the security boundary is important
      // enough to state outright.)
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: JwtPayload,
  ): Promise<{ userId: string; version: number }> {
    const refreshToken = req?.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    if (typeof payload.ver !== 'number') {
      // Tokens issued before rotation tracking was introduced have no `ver`.
      throw new UnauthorizedException('Refresh token missing version');
    }
    // Validates hash match AND detects reuse of rotated-out tokens.
    await this.authService.validateRefreshToken(
      payload.sub,
      refreshToken,
      payload.ver,
    );
    return { userId: payload.sub, version: payload.ver };
  }
}
