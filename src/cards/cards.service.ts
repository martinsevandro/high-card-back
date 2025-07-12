import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Card, CardDocument } from './schemas/card.schema';
import { CreateCardDto } from './dto/create-card.dto';

@Injectable()
export class CardsService {
  constructor(@InjectModel(Card.name) private cardModel: Model<CardDocument>) {}

  async createCard(cardData: CreateCardDto, userId: string): Promise<Card> {
    const createdCard = new this.cardModel({
      ...cardData,
      userId: new Types.ObjectId(userId),
    });
    return createdCard.save();
  }

  async findAllByUser(userId: string): Promise<Card[]> {
    return this.cardModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }
}
