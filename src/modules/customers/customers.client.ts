import { Inject, Injectable, OnModuleInit, Optional } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
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
    @Optional()
    @Inject('CUSTOMERS_GRPC_SERVICE')
    private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    if (this.client) {
      this.customersService =
        this.client.getService<CustomersServiceGrpc>('CustomersService');
    }
  }

  getCustomer(customerId: string) {
    if (!this.customersService) {
      throw new Error(
        'gRPC customer service is not available. Set ENABLE_GRPC=true to enable it.',
      );
    }
    return this.customersService.getCustomer({ customerId });
  }
}
