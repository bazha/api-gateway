import { Controller, Get } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('/products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService
  ) {}

  @Get()
  getOrder() {
    return this.productsService.getProducts('Get product 1');
  }
}