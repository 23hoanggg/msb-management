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

  // 1. HÀM GỌI MÓN (Đã nâng cấp PENDING)
  async addOrderItem(dto: CreateOrderDto) {
    if (dto.quantity <= 0) {
      throw new BadRequestException('Số lượng phải lớn hơn 0');
    }

    return this.prisma.$transaction(async (tx) => {
      // Kiểm tra phiên hát
      const session = await tx.roomSession.findUnique({
        where: { id: dto.sessionId },
      });
      if (!session || session.endTime !== null) {
        throw new BadRequestException(
          'Phiên hát này không tồn tại hoặc đã thanh toán!',
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

      // ====================================================
      // LOGIC MỚI: CHỈ CỘNG DỒN VÀO NHỮNG MÓN ĐANG "PENDING"
      // ====================================================
      const pendingOrderItem = await tx.orderItem.findFirst({
        where: {
          sessionId: dto.sessionId,
          productId: dto.productId,
          status: 'PENDING', // <--- Tìm dòng đang chờ phục vụ
        },
      });

      let resultData;
      let message = '';

      if (pendingOrderItem) {
        // Nếu đợt này đang gọi Bia rồi, khách gọi thêm thì cộng dồn số lượng
        resultData = await tx.orderItem.update({
          where: { id: pendingOrderItem.id },
          data: { quantity: pendingOrderItem.quantity + dto.quantity },
          include: { product: true },
        });
        message = 'Đã cộng dồn món vào lượt gọi hiện tại!';
      } else {
        // Nếu trước đó đã giao rồi (SERVED), nay khách gọi tiếp -> TẠO DÒNG MỚI
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

      // Phát loa thông báo cho Lễ tân
      this.eventsGateway.server.emit('new-order', {
        sessionId: dto.sessionId,
        message: `Khách vừa đặt ${dto.quantity} ${product.name}`,
        data: resultData,
      });

      return { message, data: resultData };
    });
  }

  // 2. LẤY CHI TIẾT HÓA ĐƠN
  async getOrderItemsBySession(sessionId: string) {
    return this.prisma.orderItem.findMany({
      where: { sessionId },
      include: { product: true },
      orderBy: { orderTime: 'desc' }, // Sắp xếp món mới gọi lên đầu
    });
  }

  // 3. HÀM GIẢM/XÓA MÓN & HOÀN KHO (Ưu tiên giảm đồ PENDING trước)
  async reduceOrderItem(dto: CreateOrderDto) {
    if (dto.quantity <= 0)
      throw new BadRequestException('Số lượng giảm phải lớn hơn 0');

    return this.prisma.$transaction(async (tx) => {
      // Tìm các dòng order của món này (Ưu tiên PENDING lấy trước)
      const orderItems = await tx.orderItem.findMany({
        where: { sessionId: dto.sessionId, productId: dto.productId },
        orderBy: { status: 'asc' }, // PENDING đứng trước SERVED
      });

      if (orderItems.length === 0)
        throw new BadRequestException('Món này chưa được gọi!');

      // Chọn dòng để trừ (Lấy dòng PENDING nếu có, không thì lấy SERVED)
      const targetItem = orderItems[0];

      if (targetItem.quantity < dto.quantity) {
        throw new BadRequestException(
          `Dòng này chỉ có ${targetItem.quantity} món, không thể giảm ${dto.quantity}!`,
        );
      }

      // Hoàn lại số lượng vào kho
      await tx.product.update({
        where: { id: dto.productId },
        data: { stockQuantity: { increment: dto.quantity } },
      });

      // Nếu giảm hết thì xóa, nếu không thì trừ đi
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

  // ====================================================
  // 4. TÍNH NĂNG MỚI: XÁC NHẬN ĐÃ GIAO (SERVED)
  // ====================================================
  async serveAllInSession(sessionId: string) {
    const result = await this.prisma.orderItem.updateMany({
      where: { sessionId: sessionId, status: 'PENDING' },
      data: { status: 'SERVED' },
    });

    return { message: `Đã đánh dấu giao xong ${result.count} món!` };
  }
}
