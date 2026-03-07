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

@UseGuards(JwtAuthGuard)
@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  //  Khách/Nhân viên gọi món
  @Post()
  addOrderItem(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.addOrderItem(createOrderDto);
  }

  // Giảm món
  @Post('reduce')
  reduceOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.reduceOrderItem(createOrderDto);
  }

  // Lấy danh sách món đã gọi
  @Get('session/:sessionId')
  getOrderItemsBySession(@Param('sessionId') sessionId: string) {
    return this.ordersService.getOrderItemsBySession(sessionId);
  }

  // ĐÁNH DẤU LÀ ĐÃ GIAO ĐỒ CHO KHÁCH
  @Patch('session/:sessionId/serve')
  serveAll(@Param('sessionId') sessionId: string) {
    return this.ordersService.serveAllInSession(sessionId);
  }
}
