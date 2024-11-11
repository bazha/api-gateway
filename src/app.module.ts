import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppService } from './app.service';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ORDER_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@rabbitmq:5672'],
          queue: 'orders_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'PRODUCT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@rabbitmq:5672'],
          queue: 'products_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'PRODUCT_GRPC_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: 'orders:3001',
          package: 'orders',
          protoPath: join(
            process.cwd(),
            './infrastructure/protos/orders.proto',
          ),
        },
      },
      {
        name: 'ORDER_GRPC_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: 'products:3002',
          package: 'products',
          protoPath: join(
            process.cwd(),
            './infrastructure/protos/products.proto',
          ),
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
