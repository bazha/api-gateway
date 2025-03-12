import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class OrdersService {
  constructor(
    @Inject('ORDER_SERVICE') private readonly ordersClient: ClientProxy,
  ) {}

  getOrders(data) {
    return this.ordersClient.send('get_orders', data);
  }

  createOrder(data) {
    return this.ordersClient.emit('create_order', data);
  }
}
