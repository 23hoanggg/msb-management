import { Controller, Post, Body, Get, UseGuards, Param } from '@nestjs/common';
import { RoomSessionsService } from './room-sessions.service';
import { CreateRoomSessionDto } from './dto/create-room-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CheckoutDto } from './dto/checkout.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/room-sessions')
export class RoomSessionsController {
  constructor(private readonly roomSessionsService: RoomSessionsService) {}

  // API Mở phòng
  @Post('check-in')
  checkIn(@Body() dto: CreateRoomSessionDto) {
    return this.roomSessionsService.checkIn(dto);
  }

  // API Xem các phòng đang hoạt động
  @Get('active')
  findAllOpen() {
    return this.roomSessionsService.findAllOpen();
  }

  // check out
  @Post('check-out/:id')
  checkOut(
    @Param('id') sessionId: string, // Lấy ID phiên hát từ URL
    @Body() checkoutDto: CheckoutDto, // Lấy mã giảm giá từ Body (nếu có)
  ) {
    // Truyền cả 2 tham số xuống cho Service xử lý
    return this.roomSessionsService.checkOut(
      sessionId,
      checkoutDto.discountCode,
    );
  }
}
