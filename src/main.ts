import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadExternalData } from './cards/utils/card.utils';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import * as compression from 'compression';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
   await loadExternalData();

   const app = await NestFactory.create(AppModule);

   const allowedOrigins =
    process.env.CORS_ORIGIN?.split(',').map(o => o.trim()).filter(Boolean) ?? [];

   app.use(helmet());
   app.use(compression());

   app.enableCors({
      origin: allowedOrigins,
      methods: ['GET,HEAD,PUT,PATCH,POST,DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: false
   });

   app.useWebSocketAdapter(new IoAdapter(app));

   app.setGlobalPrefix('api');

   await app.listen(process.env.PORT ?? 3000);

   console.log(`Servidor iniciado na porta ${process.env.PORT ?? 3000}`);
   console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);

}
bootstrap();
