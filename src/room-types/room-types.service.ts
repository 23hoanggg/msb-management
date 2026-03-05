import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';

@Injectable()
export class RoomTypesService {
  constructor(private prisma: PrismaService) {}

  // lay tat ca cac loai phong
  async findAll() {
    return this.prisma.roomType.findMany({
      orderBy: { basePrice: 'asc' },
    });
  }

  // Lay 1 phong
  async findOne(id: string) {
    const roomType = await this.prisma.roomType.findUnique({
      where: { id },
    });
    if (!roomType)
      throw new NotFoundException('Không tìm thấy loại phòng này!');

    return roomType;
  }

  // Tao moi loai phong
  async create(createRoomTypeDto: CreateRoomTypeDto) {
    const newRoomType = await this.prisma.roomType.create({
      data: {
        name: createRoomTypeDto.name,
        description: createRoomTypeDto.description,
        basePrice: createRoomTypeDto.basePrice,
      },
    });
    return { message: 'Tạo loại phòng thành công! ', data: newRoomType };
  }

  // Sua thong tin, gia phong
  async update(id: string, updateRoomTypeDto: UpdateRoomTypeDto) {
    await this.findOne(id);

    const updateRoomType = await this.prisma.roomType.update({
      where: { id },
      data: updateRoomTypeDto,
    });
    return { message: 'Cập nhật loại phòng thành công!', data: updateRoomType };
  }

  // xoa loai phong (co rang buoc bao ve du lieu)
  async remove(id: string) {
    const roomType = await this.prisma.roomType.findUnique({
      where: { id },
      include: { rooms: true },
    });
    if (!roomType)
      throw new NotFoundException('Không tìm thấy loại phòng này!');
    if (roomType.rooms.length > 0) {
      throw new BadRequestException(
        `Không thể xóa! Đang có ${roomType.rooms.length} phòng hát thuộc loại này`,
      );
    }

    await this.prisma.roomType.delete({
      where: { id },
    });
    return { message: `Đã xóa thành công loại phòng: ${roomType.name}` };
  }
}
