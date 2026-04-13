import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHmac } from 'crypto';

const REFRESH_SECRET = 'test-refresh-secret';

const hmac = (token: string) =>
  createHmac('sha256', REFRESH_SECRET).update(token).digest('hex');

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
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockJwtService = {
      sign: jest.fn(),
      signAsync: jest.fn(),
    };

    const config: Record<string, string> = {
      JWT_SECRET: 'test-secret',
      JWT_REFRESH_SECRET: REFRESH_SECRET,
    };
    mockConfigService = {
      get: jest.fn((key: string) => config[key]),
      getOrThrow: jest.fn((key: string) => {
        const value = config[key];
        if (value === undefined) {
          throw new Error(`Missing config: ${key}`);
        }
        return value;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'USERS_REPOSITORY', useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
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
      // The saved password must be a bcrypt hash, never the plaintext —
      // guard against a regression that removes the hash step.
      const savedArg = mockUserRepository.create.mock.calls[0][0];
      expect(savedArg.password).not.toBe(signUpDto.password);
      expect(await bcrypt.compare(signUpDto.password, savedArg.password)).toBe(
        true,
      );
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

      // Assert only the caller-relevant fields so that a future narrowing
      // of the return shape (e.g. stripping `password`) doesn't fail here
      // for the wrong reason.
      expect(result).toMatchObject({ id: 1, email, name: 'Test User' });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('still runs bcrypt.compare when user is not found (timing-safe)', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      const compareSpy = jest.spyOn(bcrypt, 'compare');

      await expect(
        service.validateUser('absent@example.com', 'any'),
      ).rejects.toThrow(UnauthorizedException);

      // Mitigates email-enumeration via response-time side channel:
      // the "user missing" path must still incur the bcrypt work.
      expect(compareSpy).toHaveBeenCalledTimes(1);
      compareSpy.mockRestore();
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
      mockJwtService.signAsync.mockResolvedValue('access-token');

      const result = await service.generateAccessToken('123');

      expect(result).toBe('access-token');
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({ sub: '123' });
    });
  });

  describe('issueInitialRefreshToken', () => {
    it('bumps version from 0→1 and persists HMAC of the new token', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        refreshTokenVersion: 0,
      });
      mockJwtService.signAsync.mockResolvedValue('fresh-token');

      const result = await service.issueInitialRefreshToken('1');

      expect(result).toBe('fresh-token');
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: '1', ver: 1 },
        { secret: REFRESH_SECRET, expiresIn: '7d' },
      );
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { id: 1, refreshTokenVersion: 0 },
        { refreshTokenHash: hmac('fresh-token'), refreshTokenVersion: 1 },
      );
    });

    it('throws if the UPDATE affects 0 rows (concurrent issuance)', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        refreshTokenVersion: 0,
      });
      mockJwtService.signAsync.mockResolvedValue('fresh-token');
      mockUserRepository.update.mockResolvedValue({ affected: 0 });

      await expect(service.issueInitialRefreshToken('1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('rotateRefreshToken', () => {
    it('atomically bumps version using the expected version as a guard', async () => {
      mockJwtService.signAsync.mockResolvedValue('rotated-token');

      const result = await service.rotateRefreshToken('42', 7);

      expect(result).toBe('rotated-token');
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: '42', ver: 8 },
        { secret: REFRESH_SECRET, expiresIn: '7d' },
      );
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { id: 42, refreshTokenVersion: 7 },
        { refreshTokenHash: hmac('rotated-token'), refreshTokenVersion: 8 },
      );
    });

    it('throws when the version guard does not match (lost the race)', async () => {
      mockJwtService.signAsync.mockResolvedValue('rotated-token');
      mockUserRepository.update.mockResolvedValue({ affected: 0 });

      await expect(service.rotateRefreshToken('42', 7)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateRefreshToken', () => {
    it('accepts a token whose version + HMAC both match the stored values', async () => {
      const token = 'valid-token';
      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        refreshTokenHash: hmac(token),
        refreshTokenVersion: 3,
      });

      await expect(
        service.validateRefreshToken('1', token, 3),
      ).resolves.toBeUndefined();
    });

    it('rejects when the stored hash is null (post-migration or after logout)', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        refreshTokenHash: null,
        refreshTokenVersion: 0,
      });

      await expect(
        service.validateRefreshToken('1', 'any-token', 0),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('revokes the family when presented with an older-version token (reuse detection)', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        refreshTokenHash: hmac('current'),
        refreshTokenVersion: 5,
      });

      await expect(
        service.validateRefreshToken('1', 'stolen-old-token', 3),
      ).rejects.toThrow(/reuse/i);
      // clearRefreshToken → update with null hash
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        { refreshTokenHash: null },
      );
    });

    it('rejects a token whose HMAC does not match the stored hash', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        refreshTokenHash: hmac('stored'),
        refreshTokenVersion: 2,
      });

      await expect(
        service.validateRefreshToken('1', 'different', 2),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a token with a future version we never issued', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        refreshTokenHash: hmac('any'),
        refreshTokenVersion: 2,
      });

      await expect(
        service.validateRefreshToken('1', 'any', 99),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('parseUserId (via findUserById)', () => {
    it.each(['abc', '1abc', '-1', '0', ' 1', '', null as any])(
      'rejects %p',
      async (input) => {
        await expect(service.findUserById(input)).rejects.toThrow(
          UnauthorizedException,
        );
      },
    );

    it('accepts a plain positive integer string', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 1 });
      await expect(service.findUserById('1')).resolves.toEqual({ id: 1 });
    });
  });
});
