import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Role, EntityStatus } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es requerido' })
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(Role, { message: 'Rol inválido' })
  @IsOptional()
  role?: Role = Role.VENDEDOR;

  @IsEnum(EntityStatus)
  @IsOptional()
  status?: EntityStatus = EntityStatus.ACTIVE;
}
