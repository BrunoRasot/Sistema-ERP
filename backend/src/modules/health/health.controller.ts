import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../../database/prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Verificar estado de salud general del sistema (Base de datos y Redis)' })
  async check(@Res() res: Response) {
    let dbStatus = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }

    const redisConnected = this.queueService.isConnected();
    const redisStatus = redisConnected ? 'ok' : 'idle';
    const isHealthy = dbStatus === 'ok';

    return res.status(isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({
      status: isHealthy ? 'ok' : 'degraded',
      service: 'vivelite-backend',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dependencies: {
        database: dbStatus,
        redis: redisStatus,
      },
    });
  }

  @Get('liveness')
  @ApiOperation({ summary: 'Liveness probe para Kubernetes / Render (comprueba que el proceso responda)' })
  liveness() {
    return { status: 'alive', uptime: process.uptime() };
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Readiness probe (comprueba si la API puede recibir tráfico)' })
  async readiness(@Res() res: Response) {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return res.status(HttpStatus.OK).json({ status: 'ready' });
    } catch {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({ status: 'not_ready' });
    }
  }
}
