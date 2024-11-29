import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ProductsService {
    constructor(
        @Inject('PRODUCT_SERVICE') private readonly productsClient: ClientProxy,
    ) {}

    getProducts(data) {
      return this.productsClient.send('helloWorldMethod', data);
    }
  }