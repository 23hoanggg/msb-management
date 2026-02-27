/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Lấy token từ Cookie thay vì từ Header
    const token = request.cookies['access_token'];

    if (!token) {
      throw new UnauthorizedException(
        'Bạn chưa đăng nhập! (Không tìm thấy Token)',
      );
    }

    try {
      // 2. Giải mã Token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      // 3. Gắn thông tin (id, role) vào Request để các hàm phía sau dùng
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn!');
    }

    return true; // Cho phép đi qua
  }
}
