import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RoomTypeModule } from './room-type/room-type.module';

@Module({
  imports: [PrismaModule, RoomTypeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
