import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Card, CardDocument } from './schemas/card.schema';
import { CreateCardDto } from './dto/create-card.dto';

@Injectable()
export class CardsService {
  constructor(@InjectModel(Card.name) private cardModel: Model<CardDocument>) {}

  async findAllByUser(userId: string): Promise<Card[]> {
    return this.cardModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
  }

  async saveCardForUser(userId: string, dto: CreateCardDto): Promise<Card> {
    const totalCards = await this.cardModel.countDocuments({ userId: new Types.ObjectId(userId) });

    if (totalCards >= 10) {
      throw new ConflictException('O limite de 10 cartas salvas foi alcançado. Exclua uma para poder salvar outra.');
    }

    const existCard = await this.cardModel.findOne({
      userId: new Types.ObjectId(userId),
      gameMode: dto.gameMode,
      championName: dto.championName,
      gameLength: dto.gameLength,
      gameDate: dto.gameDate,
      kda: dto.kda,
      damagePerMinute: dto.damagePerMinute,
    });

    if( existCard ) {
      throw new ConflictException('Essa carta já foi salva, meu patrão.');
    } 
    
    const card = new this.cardModel({
      ...dto,
      userId: new Types.ObjectId(userId),
    });

    return card.save();
  }

  async deleteCardById(userId: string, cardId: string): Promise<void> {
    const card = await this.cardModel.findOne({ 
      _id: cardId, 
      userId: new Types.ObjectId(userId)
    });

    if (!card) {
      throw new NotFoundException('Carta não encontrada.');
    } 

    await this.cardModel.deleteOne({ _id: cardId });
  }

}
