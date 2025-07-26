import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CardDocument = Card & Document;

@Schema({ timestamps: true })
export class Card {
   _id?: Types.ObjectId;

   @Prop({ type: Types.ObjectId, ref: 'User', required: true })
   userId: Types.ObjectId;

   @Prop({ required: true })
   gameMode: string;

   @Prop({ required: true })
   championName: string;

   @Prop()
   riotIdGameName: string;

   @Prop()
   riotIdTagline: string;

   @Prop()
   positionPlayer: string;

   @Prop()
   role: string;

   @Prop()
   realRole: string;

   @Prop()
   kills: number;

   @Prop()
   deaths: number;

   @Prop()
   assists: number;

   @Prop()
   kda: string;

   @Prop()
   killParticipation: string;

   @Prop()
   totalDamageDealtToChampions: number;

   @Prop()
   totalMinionsKilled: number;

   @Prop()
   totalNeutralMinionsKilled: number;

   @Prop()
   totalMinionsKilledJg: number;

   @Prop()
   teamId: number;

   @Prop()
   teamDragonsKilled: number;

   @Prop()
   teamBaronsKilled: number;

   @Prop()
   matchDragons: number;

   @Prop()
   matchBarons: number;

   @Prop()
   jungleKing: boolean;

   @Prop()
   gameLength: number;

   @Prop()
   damagePerMinute: string;

   @Prop()
   minionsPerMinute: string;

   @Prop()
   minionsPerMinuteJg: string;

   @Prop()
   goldPerMinute: string;

   @Prop()
   timeCCingOthers: number;

   @Prop()
   visionScore: number;

   @Prop()
   firstBloodKill: boolean;

   @Prop()
   firstBloodAssist: boolean;

   @Prop()
   firstTowerKill: boolean;

   @Prop()
   firstTowerAssist: boolean;

   @Prop()
   totalDamageShieldedOnTeammates: number;

   @Prop()
   totalHealsOnTeammates: number;

   @Prop()
   totalDamageTaken: number;

   @Prop()
   baronKills: number;

   @Prop()
   dragonKills: number;

   @Prop()
   quadraKills: number;

   @Prop()
   pentaKills: number;

   @Prop()
   splashArt: string;

   @Prop()
   iconChampion: string;

   @Prop()
   corDaBorda: string;

   @Prop()
   corDoVerso: string;

   @Prop({ type: Object })
   perks: Record<string, string>;

   @Prop({ type: Object })
   summonerSpells: Record<string, string>;

   @Prop({ type: Object })
   items: Record<string, string | null>;

   @Prop({ type: Object })
   augments: Record<string, string | null>;

   @Prop({ type: [String], default: [] })
   achievements: string[];

   @Prop()
   gameDate: string;
}

export const CardSchema = SchemaFactory.createForClass(Card);

CardSchema.index(
   {
      userId: 1,
      gameMode: 1,
      championName: 1,
      gameLength: 1,
      gameDate: 1,
      kda: 1,
      damagePerMinute: 1,
   },
   {
      unique: true,
      name: 'unique_card_per_user',
   },
);
