import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PREVENT_IN_DEMO_KEY } from '../decorators/prevent-in-demo.decorator';

@Injectable()
export class DemoModeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isDemoMode =
      process.env.APP_ENV === 'demo' ||
      process.env.DEMO_MODE === 'true' ||
      process.env.NODE_ENV === 'demo';

    if (!isDemoMode) {
      return true;
    }

    const preventMessage = this.reflector.getAllAndOverride<string | undefined>(
      PREVENT_IN_DEMO_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (preventMessage) {
      throw new ForbiddenException(
        preventMessage ||
          'Modo Demostración: Esta operación del sistema está protegida para mantener la disponibilidad del portafolio.',
      );
    }

    return true;
  }
}
