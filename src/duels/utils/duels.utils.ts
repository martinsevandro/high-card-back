import { Card } from "src/cards/schemas/card.schema";

export function sanitizeCard(card: Card | null) {
  if (!card) return null;

  return {
    _id: card._id?.toString(),
    championName: card.championName,
    riotGameName: card.riotIdGameName,
    riotIdTagline: card.riotIdTagline,
    kills: card.kills,
    deaths: card.deaths,
    assists: card.assists,
    kda: card.kda,  
    killParticipation: card.killParticipation,
    totalDamageDealtToChampions: card.totalDamageDealtToChampions,
    totalMinionsKilled: card.totalMinionsKilled,
    totalNeutralMinionsKilled: card.totalNeutralMinionsKilled,
    totalMinionsKilledJg: card.totalMinionsKilledJg,
    gameLength: card.gameLength,
    damagePerMinute: card.damagePerMinute,
    minionsPerMinute: card.minionsPerMinute,
    minionsPerMinuteJg: card.minionsPerMinuteJg,
    goldPerMinute: card.goldPerMinute,
    timeCCingOthers: card.timeCCingOthers,
    visionScore: card.visionScore,
    totalDamageShieldedOnTeammates: card.totalDamageShieldedOnTeammates,
    totalHealsOnTeammates: card.totalHealsOnTeammates,
    totalDamageTaken: card.totalDamageTaken,
    splashArt: card.splashArt,
    iconChampion: card.iconChampion,
    corDaBorda: card.corDaBorda,
    corDoVerso: card.corDoVerso,
    perks: card.perks,
    summonerSpells: card.summonerSpells,
    items: card.items,
    augments: card.augments,
    achievements: card.achievements,
    gameDate: card.gameDate, 
  };
}

export function sanitizePlayer(player: any) {
  if (!player) return null;

  return {
    username: player.username,
    hand: player.hand?.map((c: Card) => sanitizeCard(c)) ?? [],
  };
}

export function sanitizeRoundResult(
  yourCard: Card | null,
  opponentCard: Card | null,
  result: string,
  scores: Record<string, number>
) {
  return {
    yourCard: sanitizeCard(yourCard),
    opponentCard: sanitizeCard(opponentCard),
    result,
    scores,
  };
}