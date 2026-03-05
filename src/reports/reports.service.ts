/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // tong doanh thu theo thoi gian
  async getRevenue(startDate?: string, endDate?: string) {
    const whereCondition: any = {
      isPaid: true,
      endTime: { not: null },
    };

    if (startDate && endDate) {
      whereCondition.endTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const stats = await this.prisma.roomSession.aggregate({
      where: whereCondition,
      _sum: {
        totalRoomFee: true,
        totalServiceFee: true,
        discountAmount: true,
        finalAmount: true,
      },
      _count: {
        id: true,
      },
    });
    return {
      timeFrame: {
        from: startDate || 'Tất cả thời gian',
        to: endDate || 'Tất cả thời gian',
      },
      totalInvoices: stats._sum.totalRoomFee || 0,
      service: stats._sum.totalRoomFee || 0,
      discount: stats._sum.discountAmount || 0,
      netTotal: stats._sum.finalAmount || 0,
    };
  }
}
