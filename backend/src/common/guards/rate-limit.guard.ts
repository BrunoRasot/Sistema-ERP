import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';

interface RequestRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private static readonly ipHitsMap = new Map<string, RequestRecord>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options || process.env.NODE_ENV === 'test' || process.env.CI === 'true') {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const clientIp =
      request.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      request.socket?.remoteAddress ||
      'unknown-ip';

    const routePath = request.route?.path || request.url;
    const trackerKey = `${clientIp}:${routePath}`;
    const now = Date.now();
    const ttlMs = options.ttlSeconds * 1000;

    let record = RateLimitGuard.ipHitsMap.get(trackerKey);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + ttlMs };
      RateLimitGuard.ipHitsMap.set(trackerKey, record);
      return true;
    }

    record.count++;

    if (record.count > options.limit) {
      const waitSeconds = Math.ceil((record.resetTime - now) / 1000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Límite de peticiones excedido para esta operación. Por favor espere ${waitSeconds} segundos antes de reintentar.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
