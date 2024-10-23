import { Injectable } from '@nestjs/common';
import { Client, ClientProxy, Transport } from '@nestjs/microservices';

@Injectable()
export class AppService {
  @Client({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://myuser:mypassword@rabbitmq:5672'],
      queue: 'api_gateway_queue',
      queueOptions: {
        durable: true,
      },
    },
  })
  private readonly client: ClientProxy;

  // constructor(
  //   @Inject('orders') private readonly clientServiceOrders: ClientProxy,
  //   @Inject('products') private readonly clientServiceProducts: ClientProxy,
  // ) {}

  getHelloOrders(data) {
    return this.client.send('helloWorldMethod', data);
  }

  getHelloProducts(data) {
    return this.client.send('helloWorldMethod', data);
  }
}
