import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { Role, EntityStatus } from '@prisma/client';

const PROTECTED_DEMO_EMAILS = [
  'admin@demo.local',
  'vendedor@demo.local',
  'cajero@demo.local',
  'repartidor@demo.local',
];

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto, currentUserId?: string) {
    const emailNormalized = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existing) {
      throw new ConflictException('Ya existe un usuario registrado con este correo electrónico');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: emailNormalized,
        password: hashedPassword,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        phone: dto.phone?.trim() || null,
        role: dto.role || Role.VENDEDOR,
        status: dto.status || EntityStatus.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (currentUserId) {
      await this.prisma.auditLog.create({
        data: {
          userId: currentUserId,
          action: 'CREATE_USER',
          entity: 'User',
          entityId: user.id,
          newValues: { email: user.email, role: user.role },
        },
      });
    }

    return user;
  }

  async findAll(search?: string, role?: Role) {
    const where: any = { deletedAt: null };

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto, currentUserId?: string) {
    const user = await this.findOne(id);

    const isDemoMode = process.env.APP_ENV === 'demo' || process.env.DEMO_MODE === 'true';
    if (isDemoMode && PROTECTED_DEMO_EMAILS.includes(user.email)) {
      if (dto.password || (dto.status && dto.status === EntityStatus.INACTIVE)) {
        throw new ForbiddenException(
          'Modo Demostración: La contraseña y estado de las cuentas demo predeterminadas están protegidos.',
        );
      }
    }

    const updateData: any = {};

    if (dto.email && dto.email.toLowerCase().trim() !== user.email) {
      const emailNormalized = dto.email.toLowerCase().trim();
      const duplicate = await this.prisma.user.findUnique({
        where: { email: emailNormalized },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('El correo ya está en uso por otro usuario');
      }
      updateData.email = emailNormalized;
    }

    if (dto.firstName) updateData.firstName = dto.firstName.trim();
    if (dto.lastName) updateData.lastName = dto.lastName.trim();
    if (dto.phone !== undefined) updateData.phone = dto.phone?.trim() || null;
    if (dto.role) updateData.role = dto.role;
    if (dto.status) updateData.status = dto.status;

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
        updatedAt: true,
      },
    });

    if (currentUserId) {
      await this.prisma.auditLog.create({
        data: {
          userId: currentUserId,
          action: 'UPDATE_USER',
          entity: 'User',
          entityId: id,
          newValues: updateData,
        },
      });
    }

    return updated;
  }

  async toggleStatus(id: string, currentUserId?: string) {
    if (currentUserId && currentUserId === id) {
      throw new BadRequestException('No puede desactivar su propia cuenta de usuario');
    }

    const user = await this.findOne(id);
    const isDemoMode = process.env.APP_ENV === 'demo' || process.env.DEMO_MODE === 'true';
    if (isDemoMode && PROTECTED_DEMO_EMAILS.includes(user.email)) {
      throw new ForbiddenException(
        'Modo Demostración: No se puede desactivar una cuenta demo predeterminada para el portafolio.',
      );
    }
    const newStatus = user.status === EntityStatus.ACTIVE ? EntityStatus.INACTIVE : EntityStatus.ACTIVE;

    if (user.role === Role.SUPER_ADMIN && newStatus === EntityStatus.INACTIVE) {
      const activeSuperAdmins = await this.prisma.user.count({
        where: { role: Role.SUPER_ADMIN, status: EntityStatus.ACTIVE, deletedAt: null },
      });
      if (activeSuperAdmins <= 1) {
        throw new BadRequestException('No se puede desactivar el único SUPER_ADMIN activo del sistema');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: newStatus },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    if (currentUserId) {
      await this.prisma.auditLog.create({
        data: {
          userId: currentUserId,
          action: 'TOGGLE_USER_STATUS',
          entity: 'User',
          entityId: id,
          newValues: { status: newStatus },
        },
      });
    }

    return updated;
  }

  async remove(id: string, currentUserId?: string) {
    if (currentUserId && currentUserId === id) {
      throw new BadRequestException('No puede eliminar su propia cuenta de usuario');
    }

    const user = await this.findOne(id);
    const isDemoMode = process.env.APP_ENV === 'demo' || process.env.DEMO_MODE === 'true';
    if (isDemoMode && PROTECTED_DEMO_EMAILS.includes(user.email)) {
      throw new ForbiddenException(
        'Modo Demostración: No se puede eliminar una cuenta demo predeterminada para el portafolio.',
      );
    }

    if (user.role === Role.SUPER_ADMIN) {
      const activeSuperAdmins = await this.prisma.user.count({
        where: { role: Role.SUPER_ADMIN, deletedAt: null },
      });
      if (activeSuperAdmins <= 1) {
        throw new BadRequestException('No se puede eliminar el único SUPER_ADMIN del sistema');
      }
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: EntityStatus.INACTIVE,
      },
    });

    if (currentUserId) {
      await this.prisma.auditLog.create({
        data: {
          userId: currentUserId,
          action: 'DELETE_USER',
          entity: 'User',
          entityId: id,
        },
      });
    }

    return { message: 'Usuario eliminado correctamente' };
  }
}
