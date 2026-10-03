import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from '../../../backend/src/modules/auth/auth.service';
import { createPrismaMock } from '../../mocks/prisma.mock';
import { createJwtServiceMock } from '../../mocks/jwt.mock';
import * as bcrypt from 'bcryptjs';
import { mockAdminUser, mockInactiveUser } from '../../fixtures/users/users.fixture';

describe('Unit Test: AuthService (Authentication & Security)', () => {
  let service: AuthService;
  let prismaMock: ReturnType<typeof createPrismaMock>;
  let jwtMock: ReturnType<typeof createJwtServiceMock>;
  let configServiceMock: any;

  beforeEach(() => {
    prismaMock = createPrismaMock();
    jwtMock = createJwtServiceMock();
    configServiceMock = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        return 'test-secret';
      }),
    };

    service = new AuthService(
      prismaMock as any,
      jwtMock as any,
      configServiceMock as any,
    );
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@vivelite.pe', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if user account is INACTIVE', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockInactiveUser,
        password: '$2a$10$testhashedpassword',
      });

      await expect(
        service.login({ email: mockInactiveUser.email, password: 'Password123!' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 10);
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockAdminUser,
        password: hashedPassword,
      });

      await expect(
        service.login({ email: mockAdminUser.email, password: 'WrongPassword!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens and user payload on valid credentials', async () => {
      const password = 'Password123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      prismaMock.user.findUnique.mockResolvedValue({
        ...mockAdminUser,
        password: hashedPassword,
      });
      prismaMock.user.update.mockResolvedValue(mockAdminUser);
      prismaMock.auditLog.create.mockResolvedValue({});

      const result = await service.login({ email: mockAdminUser.email, password });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockAdminUser.email);
      expect(prismaMock.user.update).toHaveBeenCalled();
    });
  });
});
