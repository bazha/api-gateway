import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { OrderModule } from './modules/orders/orders.module';
import { ProductModule } from './modules/products/products.module';
import { CustomerModule } from './modules/customers/customers.module';
import { ExceptionsFilter } from './common/filters/exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
@Module({
  imports: [
    OrderModule,
    ProductModule,
    CustomerModule,
  ],
  controllers: [],
  providers: [ 
    {
      provide: APP_FILTER,
      useClass: ExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    }
  ],
})
export class AppModule { }
