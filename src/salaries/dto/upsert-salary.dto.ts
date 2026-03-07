import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpsertSalaryDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  month: number;

  @IsNumber()
  year: number;

  @IsNumber()
  baseSalary: number; // Lương cơ bản

  @IsOptional()
  @IsNumber()
  bonus?: number; // Thưởng

  @IsOptional()
  @IsNumber()
  deduction?: number; // Phạt / Tạm ứng

  @IsOptional()
  @IsString()
  note?: string; // Ghi chú
}
