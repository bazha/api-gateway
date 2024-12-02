import { Module } from '@nestjs/common';
import { OrdersService } from './orders/orders.service';
import { OrdersController } from './orders/orders.controller';
import { ProductsService } from './products/products.service';
import { ProductsController } from './products/products.controller';
import { CustomersController } from './customers/customers.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CustomersClientService } from './customers/customers.client';
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
        name: 'ORDER_GRPC_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: 'orders:3001',
          package: 'orders',
          protoPath: join(__dirname, '../src/protos/orders.proto'),
        },
      },
      {
        name: 'PRODUCT_GRPC_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: 'products:3002',
          package: 'products',
          protoPath: join(__dirname, '../src/protos/products.proto'),
        },
      },
      {
        name: 'CUSTOMERS_GRPC_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'customers',
          protoPath: join(__dirname, '../src/protos/customers.proto'),
          url: 'customers:3003',
        },
      },
    ]),
  ],
  controllers: [ProductsController, OrdersController, CustomersController],
  providers: [ProductsService, OrdersService, CustomersClientService],
})
export class AppModule {}
