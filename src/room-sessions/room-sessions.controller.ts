/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Param,
  Req,
} from '@nestjs/common';
import { RoomSessionsService } from './room-sessions.service';
import { CreateRoomSessionDto } from './dto/create-room-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CheckoutDto } from './dto/checkout.dto';

@Controller('api/room-sessions')
export class RoomSessionsController {
  constructor(private readonly roomSessionsService: RoomSessionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('check-in')
  checkIn(@Body() dto: CreateRoomSessionDto, @Req() req: any) {
    console.log('Dữ liệu User từ Token:', req.user);
    const staffId = req.user.sub;
    return this.roomSessionsService.checkIn(dto, staffId);
  }

  @Get('active')
  findAllOpen() {
    return this.roomSessionsService.findAllOpen();
  }

  @UseGuards(JwtAuthGuard)
  @Post('check-out/:id')
  checkOut(
    @Param('id') sessionId: string,
    @Body() checkoutDto: CheckoutDto,
    @Req() req: any,
  ) {
    const staffId = req.user.sub;
    return this.roomSessionsService.checkOut(
      sessionId,
      staffId,
      checkoutDto.discountCode,
    );
  }

  // Xem lịch sử hóa đơn
  @UseGuards(JwtAuthGuard)
  @Get('history')
  getPaidSessions() {
    return this.roomSessionsService.getPaidSessions();
  }
}
