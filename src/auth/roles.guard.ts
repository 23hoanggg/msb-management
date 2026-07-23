/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Nếu request không có thông tin user (do chưa đăng nhập hoặc thiếu token)
    if (!user || !user.role) {
      throw new ForbiddenException(
        'Bạn chưa đăng nhập hoặc không có quyền truy cập chức năng này!',
      );
    }

    // Lúc này chắc chắn user đã tồn tại, kiểm tra role an toàn
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập chức năng này! Chỉ dành cho: ' +
          requiredRoles.join(', '),
      );
    }

    return true;
  }
}
