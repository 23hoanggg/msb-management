import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SalariesService } from './salaries.service';
import { UpsertSalaryDto } from './dto/upsert-salary.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('api/salaries')
export class SalariesController {
  constructor(private readonly salariesService: SalariesService) {}

  // Lấy danh sách lương
  @Get()
  findAll(@Query('month') month: string, @Query('year') year: string) {
    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    const y = year ? parseInt(year) : new Date().getFullYear();
    return this.salariesService.findAll(m, y);
  }

  // Cập nhật hoặc lưu lương nhân viên
  @Post('upsert')
  upsertSalary(@Body() dto: UpsertSalaryDto) {
    return this.salariesService.upsertSalary(dto);
  }

  // Xác nhận đã trả lương
  @Patch(':id/pay')
  paySalary(@Param('id') id: string) {
    return this.salariesService.paySalary(id);
  }
}
