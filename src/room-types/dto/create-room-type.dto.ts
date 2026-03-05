import { IsNumber, IsString } from 'class-validator';

export class CreateRoomTypeDto {
  @IsString()
  name: string;
  @IsNumber()
  basePrice: number;
  @IsString()
  description?: string;
}
