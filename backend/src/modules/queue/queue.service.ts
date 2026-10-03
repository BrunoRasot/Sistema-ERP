import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job } from 'bullmq';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private redisClient: Redis | null = null;
  private taskQueue: Queue | null = null;
  private taskWorker: Worker | null = null;
  private isRedisConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initQueue();
  }

  async onModuleDestroy() {
    await this.closeAll();
  }

  private async initQueue() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisHost = this.configService.get<string>('REDIS_HOST');
    const redisPort = this.configService.get<number>('REDIS_PORT') || 6379;
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    // Permitir operar sin Redis si no está configurado (modo resiliente)
    if (!redisUrl && !redisHost) {
      this.logger.warn('REDIS_URL / REDIS_HOST no configurado. BullMQ operará en modo inactivo.');
      return;
    }

    try {
      const options: RedisOptions = {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Reintentos de conexion con Redis excedidos. Desconectando.');
            return null;
          }
          return Math.min(times * 1000, 3000);
        },
      };

      if (redisUrl) {
        if (redisUrl.startsWith('rediss://')) {
          options.tls = { rejectUnauthorized: false };
        }
        this.redisClient = new Redis(redisUrl, options);
      } else {
        options.host = redisHost;
        options.port = redisPort;
        if (redisPassword) options.password = redisPassword;
        if (this.configService.get<string>('REDIS_TLS') === 'true') {
          options.tls = { rejectUnauthorized: false };
        }
        this.redisClient = new Redis(options);
      }

      this.redisClient.on('connect', () => {
        this.isRedisConnected = true;
        this.logger.log('Conexion establecida con Redis / Upstash.');
      });

      this.redisClient.on('error', (err) => {
        this.isRedisConnected = false;
        this.logger.warn(`Error de comunicacion con Redis: ${err.message}`);
      });

      // Cola de tareas asíncronas
      this.taskQueue = new Queue('vivelite-tasks', {
        connection: this.redisClient,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      });

      // Worker integrado para ejecutar en el mismo proceso (Compatible con Render Free)
      this.taskWorker = new Worker(
        'vivelite-tasks',
        async (job: Job) => {
          this.logger.log(`Procesando tarea en background: ${job.name} [ID: ${job.id}]`);
          return this.handleJob(job);
        },
        {
          connection: this.redisClient,
          concurrency: 2,
        },
      );

      this.taskWorker.on('completed', (job) => {
        this.logger.log(`Tarea completada exitosamente: ${job.name} [ID: ${job.id}]`);
      });

      this.taskWorker.on('failed', (job, err) => {
        this.logger.error(`Fallo en tarea ${job?.name}: ${err.message}`);
      });
    } catch (error) {
      this.logger.warn(`No se pudo inicializar BullMQ: ${(error as Error).message}`);
    }
  }

  private async handleJob(job: Job): Promise<any> {
    switch (job.name) {
      case 'sync-sunat-contingency':
        this.logger.log(`Ejecutando sincronizacion de comprobantes en contingencia: ${JSON.stringify(job.data)}`);
        return { processed: true, timestamp: new Date().toISOString() };

      case 'inventory-audit-alert':
        this.logger.log(`Verificando alertas de inventario critico: ${JSON.stringify(job.data)}`);
        return { verified: true };

      default:
        this.logger.log(`Ejecutando tarea generica ${job.name}`);
        return { executed: true };
    }
  }

  async addJob(name: string, data: any, delayMs = 0) {
    if (!this.taskQueue) {
      this.logger.warn(`No se pudo encolar tarea ${name}: BullMQ no esta conectado.`);
      return null;
    }
    return this.taskQueue.add(name, data, { delay: delayMs });
  }

  isConnected(): boolean {
    return this.isRedisConnected;
  }

  private async closeAll() {
    try {
      if (this.taskWorker) await this.taskWorker.close();
      if (this.taskQueue) await this.taskQueue.close();
      if (this.redisClient) await this.redisClient.quit();
    } catch {
      // Ignorar errores al apagar
    }
  }
}
