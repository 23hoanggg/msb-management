import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // HÀM GỌI MÓN
  async addOrderItem(dto: CreateOrderDto) {
    if (dto.quantity <= 0) {
      throw new BadRequestException('Số lượng phải lớn hơn 0');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Kiểm tra Phiên hát có hợp lệ và đang mở không?
      const session = await tx.roomSession.findUnique({
        where: { id: dto.sessionId },
      });
      if (!session || session.endTime !== null) {
        throw new BadRequestException(
          'Phiên hát này không tồn tại hoặc đã thanh toán đóng phòng!',
        );
      }

      // 2. Kiểm tra Sản phẩm và Số lượng tồn kho
      const product = await tx.product.findUnique({
        where: { id: dto.productId },
      });
      if (!product) throw new NotFoundException('Sản phẩm không tồn tại!');
      if (product.stockQuantity < dto.quantity) {
        throw new BadRequestException(
          `Trong kho chỉ còn ${product.stockQuantity} ${product.name}, không đủ để đặt!`,
        );
      }

      // 3. Trừ số lượng tồn kho của Sản phẩm
      await tx.product.update({
        where: { id: dto.productId },
        data: { stockQuantity: product.stockQuantity - dto.quantity },
      });

      // 4. Kiểm tra xem món này đã được gọi trong phiên này chưa?
      const existingOrderItem = await tx.orderItem.findFirst({
        where: {
          sessionId: dto.sessionId,
          productId: dto.productId,
        },
      });

      if (existingOrderItem) {
        // Nếu đã gọi rồi -> Cộng dồn số lượng
        const updatedItem = await tx.orderItem.update({
          where: { id: existingOrderItem.id },
          data: { quantity: existingOrderItem.quantity + dto.quantity },
          include: { product: true }, // Trả về thông tin sản phẩm để FE dễ hiển thị
        });
        return { message: 'Đã cộng dồn món thành công!', data: updatedItem };
      } else {
        // Nếu chưa gọi -> Tạo mới dòng hóa đơn
        const newItem = await tx.orderItem.create({
          data: {
            sessionId: dto.sessionId,
            productId: dto.productId,
            quantity: dto.quantity,
            priceAtTime: product.price,
          },
          include: { product: true },
        });
        return { message: 'Đã thêm món mới thành công!', data: newItem };
      }
    });
  }

  // Hàm xem chi tiết các món đã gọi của một Phiên hát (Dùng để in tạm tính)
  async getOrderItemsBySession(sessionId: string) {
    return this.prisma.orderItem.findMany({
      where: { sessionId },
      include: { product: true },
    });
  }
}
