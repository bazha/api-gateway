import { Controller, Get, Param, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.ordersService.getOrders(`Get order ${id}`);
  }

  @Public()
  @Post()
  createOrder() {
    const order = { id: 1, product: 'Laptop' };
    this.ordersService.createOrder(order);

    return { message: 'Order created!' };
  }
}
