import { Module } from '@nestjs/common';
import { RoomTypesService } from './room-types.service';
import { RoomTypesController } from './room-types.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [RoomTypesService, PrismaService],
  controllers: [RoomTypesController],
})
export class RoomTypesModule {}
