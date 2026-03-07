/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Patch,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/auth/roles.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly cloudinaryService: CloudinaryService, // Import service upload
  ) {}

  @Get()
  findAll() {
    return this.categoriesService.finnAll();
  }

  // SỬ DỤNG MULTER ĐỂ HỨNG FILE
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('image')) // Tên trường file gửi từ Frontend phải là 'image'
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() file: Express.Multer.File, // File lấy từ Multer
  ) {
    // Nếu có file ảnh được gửi lên, thì upload lên Cloudinary
    if (file) {
      const uploadedInfo = await this.cloudinaryService.uploadImage(file);
      // Gán cái link URL xịn xò từ Cloudinary vào DTO trước khi lưu Database
      createCategoryDto.imageUrl = uploadedInfo.secure_url;
    }

    return this.categoriesService.create(createCategoryDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  // Thêm API Update
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }
}
