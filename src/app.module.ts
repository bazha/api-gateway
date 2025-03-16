import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';

import { OrderModule } from './modules/orders/orders.module';
import { ProductModule } from './modules/products/products.module';
import { CustomerModule } from './modules/customers/customers.module';
import { AuthModule } from './modules/auth/auth.module';
import { ExceptionsFilter } from './common/filters/exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RateLimiterModule } from './modules/rate-limiter/rate-limiter.module';
import { ThrottlerGuard } from '@nestjs/throttler';
@Module({
  imports: [
    OrderModule,
    ProductModule,
    CustomerModule,
    AuthModule,
    RateLimiterModule,
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
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
