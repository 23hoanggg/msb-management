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

  // HÀM GỌI MÓN
  async addOrderItem(dto: CreateOrderDto) {
    if (dto.quantity <= 0) {
      throw new BadRequestException('Số lượng phải lớn hơn 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const session = await tx.roomSession.findUnique({
        where: { id: dto.sessionId },
      });
      if (!session || session.endTime !== null) {
        throw new BadRequestException(
          'Phiên hát này không tồn tại hoặc đã thanh toán!',
        );
      }

      const product = await tx.product.findUnique({
        where: { id: dto.productId },
      });
      if (!product) throw new NotFoundException('Sản phẩm không tồn tại!');
      if (product.stockQuantity < dto.quantity) {
        throw new BadRequestException(
          `Trong kho chỉ còn ${product.stockQuantity} ${product.name}!`,
        );
      }

      await tx.product.update({
        where: { id: dto.productId },
        data: { stockQuantity: product.stockQuantity - dto.quantity },
      });

      const existingOrderItem = await tx.orderItem.findFirst({
        where: { sessionId: dto.sessionId, productId: dto.productId },
      });

      let resultData;
      let message = '';

      if (existingOrderItem) {
        resultData = await tx.orderItem.update({
          where: { id: existingOrderItem.id },
          data: { quantity: existingOrderItem.quantity + dto.quantity },
          include: { product: true },
        });
        message = 'Đã cộng dồn món thành công!';
      } else {
        resultData = await tx.orderItem.create({
          data: {
            sessionId: dto.sessionId,
            productId: dto.productId,
            quantity: dto.quantity,
            priceAtTime: product.price,
          },
          include: { product: true },
        });
        message = 'Đã thêm món mới thành công!';
      }

      this.eventsGateway.server.emit('new-order', {
        sessionId: dto.sessionId,
        message: `Khách vừa đặt ${dto.quantity} ${product.name}`,
        data: resultData,
      });

      return { message, data: resultData };
    });
  }

  // Lấy chi tiết món (Dùng in bill)
  async getOrderItemsBySession(sessionId: string) {
    return this.prisma.orderItem.findMany({
      where: { sessionId },
      include: { product: true },
    });
  }
}
