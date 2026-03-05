import { RoomStatus } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  name?: string;
  @IsOptional()
  @IsString()
  typeId?: string;
  @IsOptional()
  @IsString()
  status?: RoomStatus;
}
