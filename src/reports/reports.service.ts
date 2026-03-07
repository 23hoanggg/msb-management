/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

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

    const sessions = await this.prisma.roomSession.findMany({
      where: whereCondition,
      select: {
        id: true,
        endTime: true,
        totalRoomFee: true,
        totalServiceFee: true,
      },
      orderBy: { endTime: 'asc' },
    });

    const revenueMap = new Map<string, any>();
    sessions.forEach((session) => {
      if (!session.endTime) return;

      const day = session.endTime.getDate().toString().padStart(2, '0');
      const month = (session.endTime.getMonth() + 1)
        .toString()
        .padStart(2, '0');
      const dateStr = `${day}/${month}`;

      if (!revenueMap.has(dateStr)) {
        revenueMap.set(dateStr, { date: dateStr, roomFee: 0, serviceFee: 0 });
      }
      const current = revenueMap.get(dateStr);
      current.roomFee += Number(session.totalRoomFee || 0);
      current.serviceFee += Number(session.totalServiceFee || 0);
    });
    const revenueByDate = Array.from(revenueMap.values());

    const sessionIds = sessions.map((s) => s.id);

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        sessionId: { in: sessionIds },
      },
      include: {
        product: true,
      },
    });

    const productMap = new Map<string, number>();

    orderItems.forEach((item) => {
      const productName = item.product?.name || 'Chưa phân loại';

      const value = Number(item.quantity || 0) * Number(item.priceAtTime || 0);

      productMap.set(productName, (productMap.get(productName) || 0) + value);
    });

    const topProducts = Array.from(productMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      timeFrame: {
        from: startDate || 'Tất cả thời gian',
        to: endDate || 'Tất cả thời gian',
      },
      totalInvoices: stats._count.id || 0,
      roomTotal: stats._sum.totalRoomFee || 0,
      service: stats._sum.totalServiceFee || 0,
      discount: stats._sum.discountAmount || 0,
      netTotal: stats._sum.finalAmount || 0,

      revenueByDate,
      topProducts,
    };
  }
}
