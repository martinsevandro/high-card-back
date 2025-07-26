import { Module } from '@nestjs/common';
import { RiotService } from './riot.service';
import { RiotController } from './riot.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
   imports: [HttpModule],
   providers: [RiotService],
   controllers: [RiotController],
   exports: [RiotService],
})
export class RiotModule {}
