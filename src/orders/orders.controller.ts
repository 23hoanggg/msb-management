import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // CÁC API PUBLIC (KHÁCH HÀNG QUÉT QR DÙNG ĐƯỢC)

  // 1. Khách / Nhân viên gọi món
  @Post()
  addOrderItem(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.addOrderItem(createOrderDto);
  }

  // 2. Khách / Nhân viên lấy danh sách món đã gọi
  @Get('session/:sessionId')
  getOrderItemsBySession(@Param('sessionId') sessionId: string) {
    return this.ordersService.getOrderItemsBySession(sessionId);
  }

  // CÁC API BẢO MẬT (CHỈ NHÂN VIÊN/ADMIN MỚI ĐƯỢC DÙNG)

  // 3. Nhân viên Giảm/Xóa món
  @Post('reduce')
  reduceOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.reduceOrderItem(createOrderDto);
  }

  // 4. Nhân viên đánh dấu ĐÃ GIAO ĐỒ
  @UseGuards(JwtAuthGuard)
  @Patch('session/:sessionId/serve')
  serveAll(@Param('sessionId') sessionId: string) {
    return this.ordersService.serveAllInSession(sessionId);
  }
}
