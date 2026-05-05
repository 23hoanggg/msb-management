import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  sessionId!: string;
  @IsString()
  productId!: string;
  @IsNumber()
  quantity!: number;
  @IsOptional()
  @IsString()
  source?: string;
}
