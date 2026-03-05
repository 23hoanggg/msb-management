import { IsString } from 'class-validator';

export class CreateRoomSessionDto {
  @IsString()
  roomId: string;
}
