import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { GetProductDto } from './dto/get-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @Inject('PRODUCT_SERVICE') private readonly productsClient: ClientProxy,
  ) {}

  getProducts(data: GetProductDto) {
    return this.productsClient.send('getProducts', data);
  }
}
