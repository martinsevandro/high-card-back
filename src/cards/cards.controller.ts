import { Controller, Post, Get, Body, UseGuards, Request, Delete, Param, HttpCode } from '@nestjs/common'; 
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CardsService } from './cards.service';

import { RequestWithUser } from 'src/auth/types/request-with-user';
import { CreateCardDto } from './dto/create-card.dto';

@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('my-deck')
  async getMyDeck(@Request() req: RequestWithUser) { 
    return this.cardsService.findAllByUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('save')
  async saveCard(@Body() dto: CreateCardDto, @Request() req: RequestWithUser) {
    const user = req.user as { id: string };
    return this.cardsService.saveCardForUser(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  async deleteCard(@Param('id') cardId: string, @Request() req: RequestWithUser): Promise<void> { 
    const user = req.user as { id: string };
    await this.cardsService.deleteCardById(user.id, cardId);
  }
}
