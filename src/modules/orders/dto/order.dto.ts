import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class GetOrderDto {
  @IsString()
  orderId: string;
}
