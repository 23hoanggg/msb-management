import { Body, Controller, Post, Get } from '@nestjs/common';
import { RoomTypeService } from './room-type.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';

@Controller('room-type')
export class RoomTypeController {
  constructor(private readonly roomTypeService: RoomTypeService) {}
  @Post()
  create(@Body() dto: CreateRoomTypeDto) {
    return this.roomTypeService.create(dto);
  }

  @Get()
  findAll() {
    return this.roomTypeService.findAll();
  }
}
