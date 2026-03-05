import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // API 1: Khách/Nhân viên gọi món
  @Post()
  addOrderItem(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.addOrderItem(createOrderDto);
  }

  // API 2: Lấy danh sách món đã gọi của 1 phòng (Dùng để xem bill tạm tính)
  @Get('session/:sessionId')
  getOrderItemsBySession(@Param('sessionId') sessionId: string) {
    return this.ordersService.getOrderItemsBySession(sessionId);
  }
}
