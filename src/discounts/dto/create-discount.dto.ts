import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDiscountDto {
  @IsString()
  code: string;
  @IsString()
  description?: string;
  @IsString()
  startDate: string;
  @IsString()
  endDate: string;
  @IsNumber()
  percent: number;
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
