import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common'; 
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CardsService } from './cards.service';

import { RequestWithUser } from 'src/auth/types/request-with-user';
import { CreateCardDto } from './dto/create-card.dto';

@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() cardData: CreateCardDto, @Request() req: any) {
    const user = req.user as { id: string };
    return this.cardsService.createCard(cardData, user.id);
} 

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAllUserCards(@Request() req: RequestWithUser) { 
    return this.cardsService.findAllByUser(req.user.id);
  }
}
