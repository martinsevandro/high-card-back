import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { AppController } from './app.controller';

import { AuthModule } from './auth/auth.module';
import { ProtectedController } from './protected.controller';

import { CardsModule } from './cards/cards.module';

import { UsersModule } from './users/users.module';

import { RiotModule } from './riot/riot.module';

import { DuelsModule } from './duels/duels.module';

import { HealthModule } from './health/health.module';

@Module({
   imports: [
      ConfigModule.forRoot({ isGlobal: true }),

      MongooseModule.forRootAsync({
         imports: [ConfigModule],
         useFactory: async (config: ConfigService) => ({
            uri: config.get<string>('MONGODB_URI'),
            autoIndex: config.get<string>('NODE_ENV') !== 'production',
            verboseRetryLog: true,
            connectionFactory: (connection) => {
               mongoose.set('debug', true);
               connection.on('connected', () => {
                  console.log(
                     `[Mongoose] Conectado a ${connection.name} no host ${connection.host}`,
                  );
               });
               connection.on('error', (err: Error) => {
                  console.error('[Mongoose] Erro de conexão:', err.message);
               });
               return connection;
            },
         }),
         inject: [ConfigService],
      }),
      AuthModule,
      CardsModule,
      UsersModule,
      RiotModule,
      DuelsModule,
      HealthModule,
   ],
   controllers: [AppController, ProtectedController],
})
export class AppModule {}
