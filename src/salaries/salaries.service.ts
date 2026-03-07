/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpsertSalaryDto } from './dto/upsert-salary.dto';

@Injectable()
export class SalariesService {
  constructor(private prisma: PrismaService) {}

  // 1. LẤY BẢNG LƯƠNG THEO THÁNG / NĂM
  async findAll(month: number, year: number) {
    return this.prisma.salary.findMany({
      where: {
        month: Number(month),
        year: Number(year),
      },
      include: {
        user: {
          select: { fullName: true, username: true, role: true },
        },
      },
      orderBy: { user: { role: 'desc' } },
    });
  }

  // 2. TẠO HOẶC CẬP NHẬT LƯƠNG
  async upsertSalary(dto: UpsertSalaryDto) {
    const bonus = dto.bonus || 0;
    const deduction = dto.deduction || 0;
    const totalSalary = dto.baseSalary + bonus - deduction;

    if (totalSalary < 0) {
      throw new BadRequestException(
        'Lỗi: Tiền phạt lớn hơn cả tiền lương và thưởng cộng lại!',
      );
    }

    return this.prisma.salary.upsert({
      where: {
        userId_month_year: {
          userId: dto.userId,
          month: dto.month,
          year: dto.year,
        },
      },
      update: {
        baseSalary: dto.baseSalary,
        bonus,
        deduction,
        totalSalary,
        note: dto.note,
      },
      create: {
        userId: dto.userId,
        month: dto.month,
        year: dto.year,
        baseSalary: dto.baseSalary,
        bonus,
        deduction,
        totalSalary,
        note: dto.note,
      },
    });
  }

  // 3. CHỐT LƯƠNG (Xác nhận đã thanh toán)
  async paySalary(id: string) {
    const salary = await this.prisma.salary.findUnique({ where: { id } });
    if (!salary) throw new NotFoundException('Không tìm thấy phiếu lương này');
    if (salary.isPaid)
      throw new BadRequestException('Phiếu lương này đã được thanh toán rồi!');

    return this.prisma.salary.update({
      where: { id },
      data: {
        isPaid: true,
        paidAt: new Date(),
      },
    });
  }
}
