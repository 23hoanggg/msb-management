/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// --- IMPORT CÁC BÁC BẢO VỆ TỪ MODULE AUTH SANG ---
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/users') // URL bây giờ là /api/users/...
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. ADMIN - LẤY DANH SÁCH NHÂN VIÊN
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // 2. ADMIN - TẠO NHÂN VIÊN
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/create-staff')
  createStaff(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createStaff(createUserDto);
  }

  // 3. ADMIN / STAFF - TỰ SỬA THÔNG TIN CÁ NHÂN CỦA MÌNH
  @UseGuards(JwtAuthGuard)
  @Patch('profile') // Dùng PATCH vì cập nhật một phần dữ liệu
  updateProfile(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.sub;
    return this.usersService.updateProfile(userId, updateUserDto);
  }

  // 4. ADMIN - RESET MẬT KHẨU NHÂN VIÊN
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('reset-password/:id')
  resetPassword(@Param('id') targetUserId: string) {
    return this.usersService.resetPassword(targetUserId);
  }

  // 5. ADMIN - XÓA NHÂN VIÊN
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
