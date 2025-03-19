import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('bootstrap');
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://guest:guest@rabbitmq:5672'],
      queue: 'api_gateway_queue',
      queueOptions: { durable: true },
    },
  });

  app.use(cookieParser());
  app.setGlobalPrefix('api');
  await app.startAllMicroservices();
  await app.listen(process.env.PORT);
  logger.log(`App has started on ${process.env.PORT}`);
}
bootstrap();
