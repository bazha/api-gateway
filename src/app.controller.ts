import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(
    @Inject('orders') private readonly ordersClient: ClientProxy,
    @Inject('products') private readonly productsClient: ClientProxy,
  ) {}

  @Get('orders')
  getOrdersService() {
    return this.ordersClient.send({ cmd: 'get_hello' }, {});
  }

  @Get('products')
  getProductsCLient() {
    return this.productsClient.send({ cmd: 'get_hello' }, {});
  }
}
