/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';

@Injectable()
export class DiscountsService {
  constructor(private prisma: PrismaService) {}

  // 1. LẤY TẤT CẢ MÃ GIẢM GIÁ
  async findAll() {
    return this.prisma.discount.findMany({
      orderBy: { startDate: 'desc' },
    });
  }

  // 2. TẠO MÃ MỚI
  async create(dto: CreateDiscountDto) {
    const existing = await this.prisma.discount.findUnique({
      where: { code: dto.code },
    });
    if (existing) throw new BadRequestException(`Mã ${dto.code} đã tồn tại!`);

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end <= start)
      throw new BadRequestException('Ngày kết thúc phải lớn hơn ngày bắt đầu!');

    return this.prisma.discount.create({
      data: {
        code: dto.code,
        description: dto.description,
        percent: dto.percent,
        startDate: start,
        endDate: end,
      },
    });
  }

  // cap nhat ma
  async update(id: string, dto: UpdateDiscountDto) {
    await this.prisma.discount
      .findUniqueOrThrow({ where: { id } })
      .catch(() => {
        throw new NotFoundException('Không tìm thấy mã giảm giá!');
      });

    return this.prisma.discount.update({
      where: { id },
      data: dto,
    });
  }

  // xóa mã
  async remove(id: string) {
    const discount = await this.prisma.discount.findUnique({
      where: { id },
      include: { sessions: true },
    });
    if (!discount) throw new NotFoundException('Không tìm thấy mã giảm giá!');
    if (discount.sessions.length > 0)
      throw new BadRequestException('Mã này đã được sử dụng trong hóa đơn');

    await this.prisma.discount.delete({ where: { id } });
    return { message: `Đã xóa mã ${discount.code} thành công` };
  }
}
