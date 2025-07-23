import { Module } from '@nestjs/common';
import { DuelsGateway } from './duels.gateway';
import { DuelsService } from './duels.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CardsModule } from 'src/cards/cards.module';


@Module({
  imports: [AuthModule, UsersModule, CardsModule],
  providers: [DuelsGateway, DuelsService],
})
export class DuelsModule {}
