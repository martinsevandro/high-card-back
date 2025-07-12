import {
  IsString,
  IsNumber,
  IsBoolean,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class Perks {
  @IsString() defense: string;
  @IsString() flex: string;
  @IsString() offense: string;
  @IsString() primaryStyle: string;
  @IsString() primaryStyleSec: string;
  @IsString() primaryStyleTert: string;
  @IsString() primaryStyleQuat: string;
  @IsString() subStyle: string;
  @IsString() subStyleSec: string;
}

class Spells {
  @IsString() spell1: string;
  @IsString() spell2: string;
}

class Items {
  @IsString() item0: string;
  @IsString() item1: string;
  @IsString() item2: string;
  @IsString() item3: string;
  @IsString() item4: string;
  @IsString() item5: string;
  @IsString() item6: string;
}

class Augments {
  @IsString() augment1: string;
  @IsString() augment2: string;
  @IsString() augment3: string;
  @IsString() augment4: string;
  @IsString() augment5: string;
  @IsString() augment6: string;
}

export class CreateCardDto {
  @IsString() gameMode: string;
  @IsString() championName: string;
  @IsString() riotIdGameName: string;
  @IsString() riotIdTagline: string;
  @IsString() positionPlayer: string;
  @IsString() role: string;
  @IsString() realRole: string;

  @IsNumber() kills: number;
  @IsNumber() deaths: number;
  @IsNumber() assists: number;
  @IsString() kda: string;
  @IsString() killParticipation: string;

  @IsNumber() totalDamageDealtToChampions: number;
  @IsNumber() totalMinionsKilled: number;
  @IsNumber() totalNeutralMinionsKilled: number;
  @IsNumber() totalMinionsKilledJg: number;
  @IsNumber() teamId: number;
  @IsNumber() teamDragonsKilled: number;
  @IsNumber() teamBaronsKilled: number;
  @IsNumber() matchDragons: number;
  @IsNumber() matchBarons: number;

  @IsBoolean() jungleKing: boolean;

  @IsNumber() gameLength: number;
  @IsString() damagePerMinute: string;
  @IsString() minionsPerMinute: string;
  @IsString() minionsPerMinuteJg: string;
  @IsString() goldPerMinute: string;

  @IsNumber() timeCCingOthers: number;
  @IsNumber() visionScore: number;

  @IsBoolean() firstBloodKill: boolean;
  @IsBoolean() firstBloodAssist: boolean;
  @IsBoolean() firstTowerKill: boolean;
  @IsBoolean() firstTowerAssist: boolean;

  @IsNumber() totalDamageShieldedOnTeammates: number;
  @IsNumber() totalHealsOnTeammates: number;
  @IsNumber() totalDamageTaken: number;

  @IsNumber() baronKills: number;
  @IsNumber() dragonKills: number;
  @IsNumber() quadraKills: number;
  @IsNumber() pentaKills: number;

  @IsString() splashArt: string;
  @IsString() iconChampion: string;
  @IsString() corDaBorda: string;
  @IsString() corDoVerso: string;

  @IsObject()
  @ValidateNested()
  @Type(() => Perks)
  perks: Perks;

  @IsObject()
  @ValidateNested()
  @Type(() => Spells)
  summonerSpells: Spells;

  @IsObject()
  @ValidateNested()
  @Type(() => Items)
  items: Items;

  @IsObject()
  @ValidateNested()
  @Type(() => Augments)
  augments: Augments;

  @IsString() gameDate: string;
}
