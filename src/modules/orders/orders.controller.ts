import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Public } from '../auth/decorators/public.decorator';
import { CreateOrderDto } from './dto/order.dto';

@Controller('/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.ordersService.getOrders({ orderId: id });
  }

  @Public()
  @Post()
  createOrder(@Body() orderData: CreateOrderDto) {
    return this.ordersService.createOrder(orderData);
  }
}
