import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

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
        name: 'ORDER_GRPC_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: 'orders:3001',
          package: 'orders',
          protoPath: join(__dirname, '../../protos/orders.proto'),
        },
      }
    ])
  ],
  controllers: [OrdersController],
  providers: [OrdersService]
})

export class OrderModule { }