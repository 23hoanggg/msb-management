import { Controller, Post, Body, Get, UseGuards, Param } from '@nestjs/common';
import { RoomSessionsService } from './room-sessions.service';
import { CreateRoomSessionDto } from './dto/create-room-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CheckoutDto } from './dto/checkout.dto';

@Controller('api/room-sessions')
export class RoomSessionsController {
  constructor(private readonly roomSessionsService: RoomSessionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('check-in')
  checkIn(@Body() dto: CreateRoomSessionDto) {
    return this.roomSessionsService.checkIn(dto);
  }

  @Get('active')
  findAllOpen() {
    return this.roomSessionsService.findAllOpen();
  }

  @UseGuards(JwtAuthGuard)
  @Post('check-out/:id')
  checkOut(@Param('id') sessionId: string, @Body() checkoutDto: CheckoutDto) {
    return this.roomSessionsService.checkOut(
      sessionId,
      checkoutDto.discountCode,
    );
  }

  //  Xem lịch sử hóa đơn
  @UseGuards(JwtAuthGuard)
  @Get('history')
  getPaidSessions() {
    return this.roomSessionsService.getPaidSessions();
  }
}
