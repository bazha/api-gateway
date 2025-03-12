import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.productsService.getProducts(`Get product ${id}`);
  }
}
