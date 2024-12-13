import {
  Controller,
  Get,
  Param,
  // HttpException,
  // HttpStatus,
} from '@nestjs/common';
import { CustomersClientService } from './customers.client';
import { status } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

@Controller()
export class CustomersController {
  constructor(private readonly customersService: CustomersClientService) {}

  @Get('/customers/:id')
  async getCustomer(@Param('id') id: string) {
    try {
      return await lastValueFrom(this.customersService.getCustomer(id));
    } catch (e) {
      console.log({ e }, 'controller gateway', status.NOT_FOUND);
      if (e.code === status.NOT_FOUND) {
        console.log({ e }, 'controller gateway', status.NOT_FOUND);
      }
    }
  }
}
