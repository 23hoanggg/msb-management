/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDTO } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Định nghĩa hằng số cho số vòng băm mật khẩu
const BCRYPT_SALT_ROUNDS = 10;
// Định nghĩa mật khẩu mặc định thống nhất toàn hệ thống
const DEFAULT_PASSWORD = '123456';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDTO) {
    const user = await this.prisma.user.findUnique({
      where: { username: loginDto.username },
    });

    if (!user) throw new UnauthorizedException('Tài khoản không tồn tại');

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid)
      throw new UnauthorizedException('Mật khẩu hoặc tài khoản không đúng');

    const payload = { sub: user.id, username: user.username, role: user.role };

    return {
      access_token: await this.jwtService.signAsync(payload),
      userInfo: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  // TẠO NHÂN VIÊN MỚI
  async createStaff(createUserDto: CreateUserDto) {
    const { username, email, fullName } = createUserDto;

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser)
      throw new BadRequestException('Tài khoản hoặc Email đã tồn tại!');

    // Sử dụng hằng số đã định nghĩa
    const hashedPassword = await bcrypt.hash(
      DEFAULT_PASSWORD,
      BCRYPT_SALT_ROUNDS,
    );

    const newUser = await this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        fullName,
        role: 'STAFF',
      },
    });

    return {
      message: `Tạo tài khoản nhân viên thành công! Mật khẩu mặc định là: ${DEFAULT_PASSWORD}`,
      userId: newUser.id,
    };
  }

  // ĐỔI MẬT KHẨU
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );
    if (!isPasswordValid)
      throw new BadRequestException('Mật khẩu cũ không chính xác!');

    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      BCRYPT_SALT_ROUNDS,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Đổi mật khẩu thành công!' };
  }

  // LẤY LẠI MẬT KHẨU
  async resetPassword(targetUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) throw new NotFoundException('Không tìm thấy nhân viên này');

    const hashedDefaultPassword = await bcrypt.hash(
      DEFAULT_PASSWORD,
      BCRYPT_SALT_ROUNDS,
    );

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { password: hashedDefaultPassword },
    });

    return {
      message: `Đã reset mật khẩu của ${user.username} về mặc định (${DEFAULT_PASSWORD})`,
    };
  }

  // cap nhat thong tin ca nhan
  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (emailExists)
        throw new BadRequestException('Email này đã được sử dụng!');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: updateUserDto.fullName,
        email: updateUserDto.email,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
      },
    });

    return {
      message: 'Cập nhật thông tin thành công!',
      user: updatedUser,
    };
  }
}
