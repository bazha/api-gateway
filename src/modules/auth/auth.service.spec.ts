import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository;
  let mockJwtService;
  let mockConfigService;

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          JWT_SECRET: 'test-secret',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'USERS_REPOSITORY',
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNewUser', () => {
    it('should hash password and create user', async () => {
      const signUpDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ ...signUpDto, id: 1 });
      mockUserRepository.save.mockResolvedValue({ ...signUpDto, id: 1 });

      const result = await service.createNewUser(signUpDto);

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: signUpDto.email },
      });
    });

    it('should throw ConflictException if user exists', async () => {
      const signUpDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });

      await expect(service.createNewUser(signUpDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const mockUser = {
        id: 1,
        email,
        password: hashedPassword,
        name: 'Test User',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(email, password);

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: await bcrypt.hash('correctpassword', 10),
        name: 'Test User',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.validateUser('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate access token', async () => {
      mockJwtService.sign.mockReturnValue('access-token');

      const result = await service.generateAccessToken('123');

      expect(result).toBe('access-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: '123' });
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token', async () => {
      mockJwtService.sign.mockReturnValue('refresh-token');

      const result = await service.generateRefreshToken('123');

      expect(result).toBe('refresh-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: '123' },
        {
          secret: 'test-refresh-secret',
          expiresIn: '7d',
        },
      );
    });
  });
});
