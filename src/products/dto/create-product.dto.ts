import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name: string;

  @Type(() => Number)
  @IsNumber()
  price: number;

  @Type(() => Number)
  @IsNumber()
  stockQuantity: number;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
