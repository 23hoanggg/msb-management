/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  // lay danh sach phong ( gia + loai phong)
  async findAll() {
    return this.prisma.room.findMany({
      include: {
        roomType: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  // xem chi tiet 1 phong
  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { roomType: true },
    });
    if (!room) throw new NotFoundException('Không tìm thấy phòng này!!');
    return room;
  }

  // tao 1 phong moi
  async create(createRoomDto: CreateRoomDto) {
    const existingRoom = await this.prisma.room.findUnique({
      where: { id: createRoomDto.id },
    });
    if (existingRoom)
      throw new BadRequestException(
        `Mã phòng ${createRoomDto.id} đã tồn tại !`,
      );
    const generatedQrCode = `QR_MUSICBOX_${createRoomDto.id}_${Date.now()}`;

    const newRoom = await this.prisma.room.create({
      data: {
        id: createRoomDto.id,
        name: createRoomDto.name,
        typeId: createRoomDto.typeId,
        qrCode: generatedQrCode,
        status: 'AVAILABLE',
      },
    });
    return { message: 'Tạo phòng thành công!', data: newRoom };
  }

  // cap nhap phong
  async update(id: string, updateRoomDto: UpdateRoomDto) {
    await this.findOne(id);

    if (updateRoomDto.typeId) {
      const roomType = await this.prisma.roomType.findUnique({
        where: { id: updateRoomDto.typeId },
      });
      if (!roomType) {
        throw new BadRequestException('Loại phòng mới không tồn tại!');
      }
    }

    const updatedRoom = await this.prisma.room.update({
      where: { id },
      data: {
        name: updateRoomDto.name,
        status: updateRoomDto.status,
        typeId: updateRoomDto.typeId,
      },
      include: { roomType: true },
    });

    return { message: 'Cập nhật phòng thành công!', data: updatedRoom };
  }
  // xoa phong + bao ve du lieu
  async remove(id: string) {
    const room = await this.findOne(id);
    if (room.status === 'OCCUPIED')
      throw new BadRequestException('Phòng đang có khách, không thể xóa!');
    await this.prisma.room.delete({
      where: { id },
    });
    return { message: `Đã xóa phòng ${room.name} thành công !` };
  }
}
