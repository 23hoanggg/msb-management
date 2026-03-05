import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Roles(Role.ADMIN)
@Controller('api/reports')
export class ReportsController {
  constructor(private reportService: ReportsService) {}

  @Get('revenue')
  getRevenue(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportService.getRevenue(startDate, endDate);
  }
}
