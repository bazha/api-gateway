import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrderDto, GetOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @Inject('ORDER_SERVICE') private readonly ordersClient: ClientProxy,
  ) {}

  getOrders(data: GetOrderDto) {
    return this.ordersClient.send('get_orders', data);
  }

  createOrder(data: CreateOrderDto) {
    return this.ordersClient.send('create_order', data);
  }
}
