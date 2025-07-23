import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadExternalData } from './cards/utils/card.utils';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
   await loadExternalData();
   const app = await NestFactory.create(AppModule);
   app.enableCors({
      origin: process.env.CORS_ORIGIN || 'http://127.0.0.1:5500',
   });

   app.useWebSocketAdapter(new IoAdapter(app));

   await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
