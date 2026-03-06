import { Module } from '@nestjs/common';
import { RoomSessionsService } from './room-sessions.service';
import { RoomSessionsController } from './room-sessions.controller';
import { PrismaService } from '../prisma/prisma.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [RoomSessionsController],
  providers: [RoomSessionsService, PrismaService],
})
export class RoomSessionsModule {}
