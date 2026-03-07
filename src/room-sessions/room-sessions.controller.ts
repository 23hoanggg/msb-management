import { Controller, Post, Body, Get, UseGuards, Param } from '@nestjs/common';
import { RoomSessionsService } from './room-sessions.service';
import { CreateRoomSessionDto } from './dto/create-room-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CheckoutDto } from './dto/checkout.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/room-sessions')
export class RoomSessionsController {
  constructor(private readonly roomSessionsService: RoomSessionsService) {}

  // Mở phòng
  @Post('check-in')
  checkIn(@Body() dto: CreateRoomSessionDto) {
    return this.roomSessionsService.checkIn(dto);
  }

  // Xem các phòng đang hoạt động
  @Get('active')
  findAllOpen() {
    return this.roomSessionsService.findAllOpen();
  }

  // check out
  @Post('check-out/:id')
  checkOut(@Param('id') sessionId: string, @Body() checkoutDto: CheckoutDto) {
    return this.roomSessionsService.checkOut(
      sessionId,
      checkoutDto.discountCode,
    );
  }
}
