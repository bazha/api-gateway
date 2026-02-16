import {
  Controller,
  Post,
  Req,
  Res,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
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
    const user = await this.authService.validateUser(body.email, body.password);
    const accessToken = await this.authService.generateAccessToken(
      user.id.toString(),
    );
    const refreshToken = await this.authService.generateRefreshToken(
      user.id.toString(),
    );

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    });

    return res.json({ access_token: accessToken });
  }

  /**
   * Update access token if refresh token is valid
   * @param body userId - the id of user
   * @param res put a new refresh_token in cookie if authentication is successfully
   * @returns An access_token if authentication is successfully
   */
  @Public()
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const { userId } = req.user as { userId };
    const newAccessToken = await this.authService.generateAccessToken(userId);
    const refreshToken = await this.authService.generateRefreshToken(userId);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    });

    return res.json({ access_token: newAccessToken });
  }
  /**
   * Create a new user
   * @param body - email, name, password
   * @param res - response
   * @returns a new a user
   */
  @Public()
  @Post('signup')
  @HttpCode(201)
  async signUp(@Body() body: SignUpDto) {
    await this.authService.createNewUser(body);
    return { message: 'User created successfully' };
  }
}
