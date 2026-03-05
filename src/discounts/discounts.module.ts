import { Module } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { DiscountsController } from './discounts.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [DiscountsService, PrismaService],
  controllers: [DiscountsController],
})
export class DiscountsModule {}
