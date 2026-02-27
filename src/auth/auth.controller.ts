/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/auth/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Get,
  Req,
  UseGuards,
  Param,
} from '@nestjs/common';
import type { Response } from 'express';
import { Role } from '@prisma/client';

import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ĐĂNG NHẬP
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    res.cookie('access_token', result.access_token, {
      httpOnly: true, // Chống XSS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 1 ngày
    });
    return {
      message: 'Đăng nhập thành công',
      user: result.userInfo,
    };
  }

  // BỔ SUNG: ĐĂNG XUẤT (Cực kỳ quan trọng)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return { message: 'Đăng xuất thành công!' };
  }

  // TEST GUARD
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return {
      message: 'Chào mừng bạn đến với trang cá nhân!',
      userData: req.user,
    };
  }

  // ADMIN - XEM BÁO CÁO
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin-only/reports')
  getAdminReports(@Req() req) {
    return {
      message: 'Xin chào Quản trị viên! Đây là dữ liệu doanh thu bí mật.',
      adminName: req['user'].username,
    };
  }

  // ADMIN - TẠO NHÂN VIÊN
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('create-staff')
  createStaff(@Body() createUserDto: CreateUserDto) {
    return this.authService.createStaff(createUserDto);
  }

  // NHÂN VIÊN/ADMIN - ĐỔI MẬT KHẨU
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Req() req, @Body() changePasswordDto: ChangePasswordDto) {
    const userId = req.user.sub;
    return this.authService.changePassword(userId, changePasswordDto);
  }

  // ADMIN - KHÔI PHỤC MẬT KHẨU
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('reset-password/:id')
  resetPassword(@Param('id') targetUserId: string) {
    return this.authService.resetPassword(targetUserId);
  }

  // CẬP NHẬT THÔNG TIN CÁ NHÂN
  @UseGuards(JwtAuthGuard)
  @Post('update-profile')
  updateProfile(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.sub; // Lấy ID từ token
    return this.authService.updateProfile(userId, updateUserDto);
  }
}
