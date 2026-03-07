/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/auth/roles.guard';
import { UpdateProductDto } from './dto/update-product.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(JwtAuthGuard)
@Controller('api/products')
export class ProductsController {
  constructor(
    private productService: ProductsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // lay tat ca san pham
  @Get()
  findAll() {
    return this.productService.findAll();
  }

  // lay san pham theo category
  @Get('category/:categoryId')
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.productService.findByCategory(categoryId);
  }

  // Admin -> tao san pham moi
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      const uploadedInfo = await this.cloudinaryService.uploadImage(file);
      createProductDto.imageUrl = uploadedInfo.secure_url;
    }
    return this.productService.create(createProductDto);
  }

  // Admin -> cap nhat san pham
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      const uploadedInfo = await this.cloudinaryService.uploadImage(file);
      updateProductDto.imageUrl = uploadedInfo.secure_url;
    }
    return this.productService.update(id, updateProductDto);
  }

  // Admin -> xoa san pham
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
