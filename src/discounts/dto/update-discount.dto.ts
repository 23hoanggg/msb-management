import { IsBoolean, IsOptional, IsNumber, IsString } from 'class-validator';

export class UpdateDiscountDto {
  @IsOptional()
  @IsString()
  code?: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @IsString()
  startDate?: string;
  @IsOptional()
  @IsString()
  endDate?: string;
  @IsOptional()
  @IsNumber()
  percent?: number;
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
