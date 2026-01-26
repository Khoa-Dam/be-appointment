import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Note: Database health check available at GET /health
  // SupabaseService is request-scoped, so we can't check it here

  await app.listen(process.env.PORT ?? 3000);
  logger.log(`🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  logger.log(`📊 Health check: http://localhost:${process.env.PORT ?? 3000}/health`);
}
bootstrap();
