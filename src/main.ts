import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: 'http://localhost:3001', // Đổi thành cổng FE Next.js của bạn (thường là 3000 hoặc 3001)
    credentials: true, // BẮT BUỘC: Cho phép đính kèm Cookie giữa 2 domain
  });

  await app.listen(3000);
}
bootstrap();
