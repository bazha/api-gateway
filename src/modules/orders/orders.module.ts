import { Module, DynamicModule } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({})
export class OrderModule {
  static forRoot(): DynamicModule {
    return {
      module: OrderModule,
      imports: [
        ConfigModule,
        ClientsModule.registerAsync({
          isGlobal: false,
          clients: [
            {
              name: 'ORDER_SERVICE',
              imports: [ConfigModule],
              useFactory: (configService: ConfigService) => ({
                transport: Transport.RMQ,
                options: {
                  urls: [configService.get<string>('RABBITMQ_URL')],
                  queue: 'orders_queue',
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
      controllers: [OrdersController],
      providers: [OrdersService],
    };
  }
}
