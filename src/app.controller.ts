import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { CustomersClientService } from './clients/customers.client';

@Controller('/api')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly customersService: CustomersClientService,
  ) {}

  @Get('/orders')
  getOrdersService() {
    return this.appService.getHelloOrders('Hello Orders');
  }

  @Get('/products')
  getProductsCLient() {
    return this.appService.getHelloProducts('Hello Products');
  }

  @Get('/customers/:id')
  async getCustomer(@Param('id') id: string) {
    return this.customersService.getCustomer(id);
  }
}
