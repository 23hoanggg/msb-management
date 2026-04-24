/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  // 1. HÀM GỌI MÓN (Dùng chung cho cả Khách và Lễ tân)
  async addOrderItem(dto: CreateOrderDto) {
    if (dto.quantity <= 0) {
      throw new BadRequestException('Số lượng phải lớn hơn 0');
    }

    return this.prisma.$transaction(async (tx) => {
      // BẢO MẬT MÃ QR ĐỘNG TẠI ĐÂY:
      const session = await tx.roomSession.findUnique({
        where: { id: dto.sessionId },
        include: { room: true },
      });

      if (!session) {
        throw new NotFoundException(
          'Mã QR không hợp lệ hoặc phiên hát không tồn tại!',
        );
      }

      // Nếu đã thanh toán hoặc đã ấn kết thúc -> Chặn đứng
      if (session.isPaid || session.endTime !== null) {
        throw new BadRequestException(
          'Phiên hát đã kết thúc! Mã QR này đã hết hạn sử dụng.',
        );
      }

      // Kiểm tra sản phẩm và tồn kho
      const product = await tx.product.findUnique({
        where: { id: dto.productId },
      });
      if (!product) throw new NotFoundException('Sản phẩm không tồn tại!');
      if (product.stockQuantity < dto.quantity) {
        throw new BadRequestException(
          `Trong kho chỉ còn ${product.stockQuantity} ${product.name}!`,
        );
      }

      // Trừ kho
      await tx.product.update({
        where: { id: dto.productId },
        data: { stockQuantity: product.stockQuantity - dto.quantity },
      });

      // Gộp món nếu đang PENDING
      const pendingOrderItem = await tx.orderItem.findFirst({
        where: {
          sessionId: dto.sessionId,
          productId: dto.productId,
          status: 'PENDING',
        },
      });

      let resultData;
      let message = '';

      if (pendingOrderItem) {
        resultData = await tx.orderItem.update({
          where: { id: pendingOrderItem.id },
          data: { quantity: pendingOrderItem.quantity + dto.quantity },
          include: { product: true },
        });
        message = 'Đã cộng dồn món vào lượt gọi hiện tại!';
      } else {
        resultData = await tx.orderItem.create({
          data: {
            sessionId: dto.sessionId,
            productId: dto.productId,
            quantity: dto.quantity,
            priceAtTime: product.price,
            status: 'PENDING',
          },
          include: { product: true },
        });
        message = 'Đã thêm một lượt gọi món mới!';
      }

      // Bắn Socket realtime báo cho Lễ tân
      this.eventsGateway.server.emit('new-order', {
        sessionId: dto.sessionId,
        roomId: session.roomId,
        roomName: session.room.name,
        message: `Khách vừa đặt ${dto.quantity} ${product.name}`,
        data: resultData,
      });

      return { message, data: resultData };
    });
  }

  // 2. LẤY CHI TIẾT HÓA ĐƠN (Khách xem trên điện thoại hoặc Lễ tân xem)
  async getOrderItemsBySession(sessionId: string) {
    return this.prisma.orderItem.findMany({
      where: { sessionId },
      include: { product: true },
      orderBy: { orderTime: 'desc' },
    });
  }

  // 3. GIẢM/XÓA MÓN & HOÀN KHO (Chỉ Lễ tân/Admin mới được làm)
  async reduceOrderItem(dto: CreateOrderDto) {
    if (dto.quantity <= 0)
      throw new BadRequestException('Số lượng giảm phải lớn hơn 0');

    return this.prisma.$transaction(async (tx) => {
      const orderItems = await tx.orderItem.findMany({
        where: { sessionId: dto.sessionId, productId: dto.productId },
        orderBy: { status: 'asc' }, // Ưu tiên trừ những món PENDING trước
      });

      if (orderItems.length === 0)
        throw new BadRequestException('Món này chưa được gọi!');

      const targetItem = orderItems[0];

      if (targetItem.quantity < dto.quantity) {
        throw new BadRequestException(
          `Dòng này chỉ có ${targetItem.quantity} món, không thể giảm ${dto.quantity}!`,
        );
      }

      // Hoàn lại kho
      await tx.product.update({
        where: { id: dto.productId },
        data: { stockQuantity: { increment: dto.quantity } },
      });

      if (targetItem.quantity === dto.quantity) {
        await tx.orderItem.delete({ where: { id: targetItem.id } });
        return { message: 'Đã xóa món khỏi hóa đơn!' };
      } else {
        await tx.orderItem.update({
          where: { id: targetItem.id },
          data: { quantity: targetItem.quantity - dto.quantity },
        });
        return { message: 'Đã giảm số lượng món!' };
      }
    });
  }

  // 4. XÁC NHẬN ĐÃ GIAO ĐỒ (Chỉ Lễ tân/Admin làm)
  async serveAllInSession(sessionId: string) {
    const result = await this.prisma.orderItem.updateMany({
      where: { sessionId: sessionId, status: 'PENDING' },
      data: { status: 'SERVED' },
    });

    this.eventsGateway.server.emit('order-status-changed', {
      sessionId: sessionId,
    });

    return { message: `Đã đánh dấu giao xong ${result.count} món!` };
  }
}
