import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { config, swaggerConfig } from './config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  // =======================================================
  // BẬT CORS TẠI ĐÂY
  // =======================================================

  // Cách 1: Cấu hình đơn giản, cho phép tất cả (dùng cho development để nhanh chóng)
  app.enableCors();

  // Cách 2: Cấu hình chi tiết hơn (khuyên dùng cho production)
  /*
  app.enableCors({
    origin: 'http://localhost:3000', // URL của Next.js frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Cho phép gửi cookie, authorization header
  });
  */
  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Setup Swagger documentation (always enabled)
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(config().swagger.path, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Start server
  await app.listen(config().app.port);
  logger.log(
    `🚀 Application running on: http://localhost:${config().app.port}`,
  );
  logger.log(`📊 Health check: http://localhost:${config().app.port}/health`);
  logger.log(
    `📚 Swagger docs: http://localhost:${config().app.port}/${config().swagger.path}`,
  );
  logger.log(`🌍 Environment: ${config().app.env}`);
}
bootstrap();
