import { IsString } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  id: string;
  @IsString()
  name: string;
  @IsString()
  typeId: string;
}
