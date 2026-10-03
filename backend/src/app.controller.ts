import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Root')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Bienvenida e información de la API de Vivelite' })
  getRoot() {
    return {
      name: 'Vivelite API — Distribuidora de Agua',
      version: '1.0.0',
      status: 'online',
      documentation: '/api/v1/docs',
      health: '/api/v1/health',
      endpoints: {
        auth: '/api/v1/auth',
        customers: '/api/v1/customers',
      },
    };
  }
}
