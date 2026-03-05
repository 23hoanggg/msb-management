/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/room-sessions/room-sessions.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomSessionDto } from './dto/create-room-session.dto';

// 1. THÊM IMPORT NÀY ĐỂ TYPESCRIPT NHẬN DIỆN ĐƯỢC KIỂU DỮ LIỆU DISCOUNT
import { Discount } from '@prisma/client';

@Injectable()
export class RoomSessionsService {
  constructor(private prisma: PrismaService) {}

  // HÀM MỞ PHÒNG (Đã làm ở bài trước, giữ nguyên)
  async checkIn(dto: CreateRoomSessionDto) {
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
    });

    if (!room) throw new NotFoundException('Không tìm thấy phòng này!');
    if (room.status !== 'AVAILABLE') {
      throw new BadRequestException(
        'Phòng này hiện không thể mở (Đang có khách hoặc đang sửa)!',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.room.update({
        where: { id: dto.roomId },
        data: { status: 'OCCUPIED' },
      });

      const session = await tx.roomSession.create({
        data: { roomId: dto.roomId },
        include: { room: true },
      });

      return { message: `Mở phòng ${dto.roomId} thành công!`, data: session };
    });
  }

  // HÀM LẤY PHÒNG ĐANG MỞ (Đã làm ở bài trước, giữ nguyên)
  async findAllOpen() {
    return this.prisma.roomSession.findMany({
      where: { endTime: null },
      include: { room: { include: { roomType: true } } },
    });
  }

  // =================================================================
  // HÀM NÂNG CẤP: ĐÓNG PHÒNG VÀ TÍNH TIỀN (ĐÃ FIX LỖI TYPESCRIPT)
  // =================================================================
  async checkOut(sessionId: string, discountCode?: string) {
    const session = await this.prisma.roomSession.findUnique({
      where: { id: sessionId },
      include: {
        room: { include: { roomType: true } },
        orderItems: true,
      },
    });

    if (!session) throw new NotFoundException('Không tìm thấy phiên hát này!');
    if (session.endTime !== null)
      throw new BadRequestException('Phiên hát này đã thanh toán rồi!');

    const endTime = new Date();
    const startTime = session.startTime;

    // 2. FIX LỖI Ở ĐÂY: Khai báo rõ ràng kiểu dữ liệu là (Discount hoặc null)
    let appliedDiscount: Discount | null = null;
    let discountPercent = 0;

    if (discountCode) {
      appliedDiscount = await this.prisma.discount.findUnique({
        where: { code: discountCode },
      });

      if (!appliedDiscount) {
        throw new BadRequestException('Mã giảm giá không tồn tại!');
      }
      if (!appliedDiscount.isActive) {
        throw new BadRequestException('Mã giảm giá này đang bị tạm khóa!');
      }
      if (
        endTime < appliedDiscount.startDate ||
        endTime > appliedDiscount.endDate
      ) {
        throw new BadRequestException(
          'Mã giảm giá đã hết hạn hoặc chưa đến thời gian áp dụng!',
        );
      }

      discountPercent = appliedDiscount.percent;
    }

    // 3. TÍNH TOÁN TIỀN
    const durationMinutes = Math.ceil(
      (endTime.getTime() - startTime.getTime()) / (1000 * 60),
    );
    const durationHours = durationMinutes / 60;

    const totalRoomFee = Math.round(
      durationHours * session.room.roomType.basePrice,
    );

    const totalServiceFee = session.orderItems.reduce((total, item) => {
      return total + item.quantity * item.priceAtTime;
    }, 0);

    const totalAmount = totalRoomFee + totalServiceFee;
    const discountAmount = Math.round((totalAmount * discountPercent) / 100);
    const finalAmount = totalAmount - discountAmount;

    // 4. LƯU DATABASE
    await this.prisma.$transaction(async (tx) => {
      await tx.roomSession.update({
        where: { id: sessionId },
        data: {
          endTime: endTime,
          totalRoomFee: totalRoomFee,
          totalServiceFee: totalServiceFee,
          totalAmount: totalAmount,
          discountAmount: discountAmount,
          finalAmount: finalAmount,
          isPaid: true,
          discountId: appliedDiscount?.id || null,
        },
      });

      await tx.room.update({
        where: { id: session.roomId },
        data: { status: 'AVAILABLE' },
      });
    });

    // 6. TRẢ VỀ BILL ĐỂ IN
    return {
      message: 'Thanh toán và đóng phòng thành công!',
      bill: {
        room: session.room.name,
        duration: `${durationMinutes} phút`,
        totalRoomFee,
        totalServiceFee,
        totalAmount,
        appliedDiscount: discountCode
          ? `${discountCode} (-${discountPercent}%)`
          : 'Không có',
        discountAmount,
        finalAmount,
      },
    };
  }
}
