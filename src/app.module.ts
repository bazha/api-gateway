import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppService } from './app.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'orders',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@rabbitmq:5672'],
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'products',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@rabbitmq:5672'],
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
