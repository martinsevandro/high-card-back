import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadExternalData } from './cards/utils/card.utils';

async function bootstrap() {
  await loadExternalData();
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
