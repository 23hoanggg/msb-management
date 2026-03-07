/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserByAdminDto } from './dto/update-user-admin.dto';

const BCRYPT_SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = '123456';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // 1. LẤY DANH SÁCH TẤT CẢ NHÂN VIÊN (Bổ sung mới)
  async findAll() {
    // Không select cột password để bảo mật dữ liệu trả về
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });
  }

  // 2. TẠO NHÂN VIÊN MỚI (Chuyển từ Auth sang)
  async createStaff(createUserDto: CreateUserDto) {
    const { username, email, fullName } = createUserDto;

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser)
      throw new BadRequestException('Tài khoản hoặc Email đã tồn tại!');

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

  // 3. SỬA THÔNG TIN NHÂN VIÊN (Chuyển từ Auth sang)
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

    return { message: 'Cập nhật thông tin thành công!', user: updatedUser };
  }

  // 5. XÓA NHÂN VIÊN (Bổ sung mới)
  async remove(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy nhân viên này');

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return {
      message: `Đã xóa tài khoản nhân viên ${user.username} thành công!`,
    };
  }
  // 1. SỬA LẠI: THAY "any" BẰNG DTO CỦA ADMIN
  async updateUserByAdmin(
    targetUserId: string,
    updateData: UpdateUserByAdminDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    if (updateData.email && updateData.email !== user.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateData.email },
      });
      if (emailExists)
        throw new BadRequestException('Email này đã được sử dụng!');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        fullName: updateData.fullName,
        email: updateData.email,
        role: updateData.role,
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
      message: 'Admin cập nhật thông tin thành công!',
      user: updatedUser,
    };
  }

  // 2. SỬA LẠI: NHẬN THÊM THAM SỐ VÀ MÃ HÓA MẬT KHẨU
  async resetPassword(userId: string, newPassword?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    // Nếu Admin gõ pass mới thì dùng, nếu không gõ thì set mặc định là "123456"
    const passwordToHash = newPassword || '123456';

    // Mã hóa mật khẩu trước khi lưu vào Database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordToHash, salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Thay đổi mật khẩu thành công!' };
  }
}
