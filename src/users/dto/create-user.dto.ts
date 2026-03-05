import { IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  username: string;
  @IsString()
  email: string;
  @IsString()
  fullName: string;
  // Không bắt truyền password, nếu không truyền sẽ dùng password mặc định
}
