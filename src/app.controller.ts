import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/orders')
  getOrdersService() {
    return this.appService.getHelloOrders('Hello Orders');
  }

  @Get('/products')
  getProductsCLient() {
    return this.appService.getHelloProducts('Hello Products');
  }
}
