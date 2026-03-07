import {
  IsEmail,
  IsNotEmpty,
  IsString,
  // IsEnum,
  // IsOptional,
} from 'class-validator';
// Nếu bạn có dùng Enum cho Role (VD: enum Role { ADMIN = 'ADMIN', STAFF = 'STAFF' }) thì import vào nhé.

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  fullName: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  // BỔ SUNG THÊM 2 TRƯỜNG NÀY ĐỂ NESTJS CHO PHÉP NHẬN DỮ LIỆU
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;

  @IsString() // Nếu bạn có dùng Enum thì đổi thành @IsEnum(Role) cho chặt chẽ nhé
  @IsNotEmpty({ message: 'Quyền (Role) không được để trống' })
  role: string;
}
