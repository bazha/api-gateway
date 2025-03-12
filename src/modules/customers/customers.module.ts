import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

import { CustomersController } from './customers.controller';
import { CustomersClientService } from './customers.client';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'CUSTOMERS_GRPC_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'customers',
          protoPath: join(__dirname, '../../protos/customers.proto'),
          url: 'customers:3003',
        },
      },
    ]),
  ],
  controllers: [CustomersController],
  providers: [CustomersClientService],
})
export class CustomerModule {}
