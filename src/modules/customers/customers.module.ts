import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CustomersController } from './customers.controller';
import { CustomersClientService } from './customers.client';

@Module({
  imports: [ConfigModule],
  controllers: [CustomersController],
  providers: [CustomersClientService],
})
export class CustomerModule {}
