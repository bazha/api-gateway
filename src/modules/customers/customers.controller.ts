import { Controller, Get, Param, Req } from '@nestjs/common';
import { CustomersClientService } from './customers.client';
// import { RpcErrorInterceptor } from '../common/interceptors/rpc-exeption.interceptor';
import { lastValueFrom } from 'rxjs';
import { Public } from '../auth/decorators/public.decorator';
@Controller('/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersClientService) {}

  @Public()
  @Get(':id')
  async getCustomer(@Req() req: Request, @Param('id') id: string) {
    try {
      return await lastValueFrom(this.customersService.getCustomer(id));
    } catch (error) {
      throw error;
    }
  }
}
