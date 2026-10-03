import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'FATAL: DATABASE_URL environment variable is missing. Check your .env file.',
      );
    }

    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

    const pool = new Pool({
      connectionString,
      ...(isLocalhost ? {} : { ssl: { rejectUnauthorized: false } }),
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: [
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });

    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Conexion exitosa con la base de datos PostgreSQL (Prisma 7 Driver Adapter).');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Conexion con PostgreSQL cerrada correctamente.');
  }
}
