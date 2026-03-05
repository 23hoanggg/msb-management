import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // lay tat ca danh muc
  async finnAll() {
    return this.prisma.category.findMany({
      include: { _count: { select: { products: true } } },
    });
  }

  // tao moi
  async create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: dto,
    });
  }

  // xoa + check san pham ben tron
  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { products: true },
    });
    if (!category) throw new NotFoundException('Không thấy danh mục');
    if (category.products.length > 0)
      throw new BadRequestException(
        'Danh mục này đang chứa sản phẩm, không thể xóa!',
      );
    return this.prisma.category.delete({ where: { id } });
  }
}
