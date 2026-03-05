import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // lay tat ca san pham
  async findAll() {
    return this.prisma.product.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  // lay san pham theo danh muc
  async findByCategory(categoryId: string) {
    return this.prisma.product.findMany({
      where: { categoryId },
    });
  }

  // tao san pham moi
  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: dto,
    });
  }

  // CAP NHAT SAN PHAM
  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm này!');

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  // xoa san pham
  async remove(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}
