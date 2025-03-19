import { Controller, Post, Req, Res, Body, UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Handles user authentication
   * @param body userId - the id of user
   * @param res put refresh_token in cookie if authentication is successfully
   * @returns An access_token if authentication is successfully
   */
  @Public()
  @Post('login')
  async login(@Body() body: LoginDto, @Res() res: Response) {
    const accessToken = await this.authService.generateAccessToken(body.userId);
    const refreshToken = await this.authService.generateRefreshToken(
      body.userId,
    );

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    });

    return res.json({ access_token: accessToken });
  }

  @Public()
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const { userId } = req.user as { userId };
    const newAccessToken = await this.authService.generateAccessToken(userId);
    const refreshToken = await this.authService.generateRefreshToken(userId);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    });

    return res.json({ access_token: newAccessToken });
  }
}
