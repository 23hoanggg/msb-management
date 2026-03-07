import { IsOptional, IsString } from 'class-validator';

export class UpdateUserByAdminDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  role?: any; // Nếu bạn dùng Enum cho Role (VD: Role.ADMIN), hãy thay 'any' bằng kiểu Enum đó nhé
}
