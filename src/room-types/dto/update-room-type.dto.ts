import { IsString, IsNumber } from 'class-validator';

export class UpdateRoomTypeDto {
  @IsString()
  name?: string;
  @IsNumber()
  basePrice?: number;
  @IsString()
  description?: string;
}
