import { Module, DynamicModule } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({})
export class ProductModule {
  static forRoot(): DynamicModule {
    return {
      module: ProductModule,
      imports: [
        ConfigModule,
        ClientsModule.registerAsync({
          isGlobal: false,
          clients: [
            {
              name: 'PRODUCT_SERVICE',
              imports: [ConfigModule],
              useFactory: (configService: ConfigService) => ({
                transport: Transport.RMQ,
                options: {
                  urls: [configService.get<string>('RABBITMQ_URL')],
                  queue: 'products_queue',
                  queueOptions: {
                    durable: true,
                  },
                  socketOptions: {
                    heartbeatIntervalInSeconds: 60,
                    reconnectTimeInSeconds: 5,
                  },
                },
              }),
              inject: [ConfigService],
            },
          ],
        }),
      ],
      controllers: [ProductsController],
      providers: [ProductsService],
    };
  }
}
