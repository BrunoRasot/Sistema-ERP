import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Role, EntityStatus } from '@prisma/client';

export class UpdateUserDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(Role, { message: 'Rol inválido' })
  @IsOptional()
  role?: Role;

  @IsEnum(EntityStatus)
  @IsOptional()
  status?: EntityStatus;
}
