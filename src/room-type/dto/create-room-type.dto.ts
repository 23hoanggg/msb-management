import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateRoomTypeDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên loại phòng không được để trống' })
  name: string;

  @IsNumber({}, { message: 'Giá mỗi giờ phải là một con số' })
  @Min(0, { message: 'Giá không được nhỏ hơn 0' })
  pricePerHour: number;
}
