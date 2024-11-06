import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AppService {
  constructor(
    @Inject('ORDER_SERVICE') private readonly ordersClient: ClientProxy,
    @Inject('PRODUCT_SERVICE') private readonly productsClient: ClientProxy,
  ) {}

  getHelloOrders(data) {
    return this.ordersClient.send('helloWorldMethod', data);
  }

  getHelloProducts(data) {
    return this.productsClient.send('helloWorldMethod', data);
  }
}
