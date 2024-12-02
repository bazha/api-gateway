import { Controller, Get, Param } from '@nestjs/common';
import { CustomersClientService } from './customers.client';

@Controller()
export class CustomersController {
  constructor(private readonly customersService: CustomersClientService) {}

  @Get('/customers/:id')
  async getCustomer(@Param('id') id: string) {
    return this.customersService.getCustomer(id);
  }
}
