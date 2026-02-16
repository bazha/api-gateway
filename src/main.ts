import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // CORS configuration
  app.enableCors({
    origin:
      configService.get<string>('ALLOWED_ORIGINS')?.split(',') ||
      'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Compression middleware
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      threshold: 1024,
    }),
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL')],
      queue: 'api_gateway_queue',
      queueOptions: { durable: true },
    },
  });

  app.use(cookieParser());
  app.setGlobalPrefix('api');
  await app.startAllMicroservices();
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  logger.log(`App has started on ${port}`);
}
bootstrap();
