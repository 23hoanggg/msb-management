import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';

@Injectable()
export class RoomTypeService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreateRoomTypeDto) {
    return this.prisma.roomType.create({
      data: {
        name: dto.name,
        pricePerHour: dto.pricePerHour,
      },
    });
  }

  async findAll() {
    return this.prisma.roomType.findMany();
  }
}
