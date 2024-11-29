import { Controller, Get, Param } from '@nestjs/common';
import { CustomersClientService } from './clients/customers.client';

@Controller('/api')
export class AppController {
  constructor(
    private readonly customersService: CustomersClientService,
  ) {}

  @Get('/customers/:id')
  async getCustomer(@Param('id') id: string) {
    return this.customersService.getCustomer(id);
  }
}
