import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('ViveliteBootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT') || 4000;
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api/v1';
  const corsOriginEnv = configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000';
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  app.enableShutdownHooks();

  app.use(helmet());
  app.use(cookieParser());

  // Configuración de CORS dinámica compatible con Vercel (*.vercel.app) y dominio de producción
  const allowedOriginsList = corsOriginEnv.split(',').map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isAllowedExplicit = allowedOriginsList.includes(origin) || allowedOriginsList.includes('*');
      const isVercelDeployment = /^https:\/\/.*\.vercel\.app$/.test(origin);
      const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

      if (isAllowedExplicit || isVercelDeployment || isLocalhost) {
        return callback(null, true);
      }

      logger.warn(`Peticion bloqueada por politica CORS desde origen no autorizado: ${origin}`);
      callback(new Error(`Origen ${origin} no permitido por la politica de seguridad CORS.`));
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Documentación OpenAPI / Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Vivelite ERP API')
    .setDescription(
      'Documentación oficial de la API REST para el Sistema de Gestión Integral de Distribuidora de Agua - Vivelite',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  // Escuchar en 0.0.0.0 para compatibilidad obligatoria con Render / Docker
  await app.listen(port, '0.0.0.0');
  logger.log(`Vivelite API backend iniciado en: http://0.0.0.0:${port}/${apiPrefix}`);
  logger.log(`Documentacion Swagger disponible en: http://0.0.0.0:${port}/${apiPrefix}/docs`);
}

bootstrap();
