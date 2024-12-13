import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { Observable } from 'rxjs';

interface CustomersServiceGrpc {
  getCustomer(data: {
    customerId: string;
  }): Observable<{ customerId: string; name: string; email: string }>;
}

@Injectable()
export class CustomersClientService implements OnModuleInit {
  private customersService: CustomersServiceGrpc;

  constructor(
    @Inject('CUSTOMERS_GRPC_SERVICE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.customersService =
      this.client.getService<CustomersServiceGrpc>('CustomersService');
  }

  getCustomer(customerId: string) {
    try {
      const response = this.customersService.getCustomer({ customerId });
      console.log({ response });
      return response;
    } catch (error) {
      console.error(error instanceof RpcException);
      console.log({ error }, 'customer client');
    }
  }
}
