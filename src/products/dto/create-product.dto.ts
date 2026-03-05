import { IsNumber, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;
  @IsNumber()
  price: number;
  @IsNumber()
  stockQuantity: number;
  @IsString()
  categoryId: string;
  @IsString()
  imageUrl?: string;
}
