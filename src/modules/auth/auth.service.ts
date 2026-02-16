import {
  Inject,
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities/user';
import { SignUpDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('USERS_REPOSITORY')
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateAccessToken(userId: string): Promise<string> {
    const payload = { sub: userId };
    return this.jwtService.sign(payload);
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const payload = { sub: userId };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
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

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async findUserById(userId: string): Promise<User> {
    return this.userRepository.findOne({ where: { id: Number(userId) } });
  }
}
