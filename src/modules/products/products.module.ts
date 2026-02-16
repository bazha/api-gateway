import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  imports: [
    ClientsModule.register([
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
          url: 'products:3002',
          package: 'products',
          protoPath: join(__dirname, '../../protos/products.proto'),
        },
      },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductModule {}
