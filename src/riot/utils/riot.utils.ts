import {
   defineRole,
   defineCorDaBordaFrontal,
   defineCorVerso,
   getShardIcon,
   getRuneIconUrl,
   getSummonerSpellIcon,
   getItemIcon,
   getAugmentIconUrl,
} from 'src/cards/utils/card.utils';

export function getRegionalRoute(server: string): string | null {
   const mapping: Record<string, string> = {
      br1: 'americas',
      na1: 'americas',
      la1: 'americas',
      la2: 'americas',
      euw1: 'europe',
      eun1: 'europe',
      tr1: 'europe',
      ru: 'europe',
      kr: 'asia',
      kr1: 'asia',
      jp1: 'asia',
      oc1: 'sea',
      ph2: 'sea',
      sg2: 'sea',
      th2: 'sea',
      tw2: 'sea',
      vn2: 'sea',
   };

   return mapping[server.toLowerCase()] || null;
}

export function isValidRiotId(
   name: string,
   tag: string,
   server: string,
): boolean {
   const validServers = [
      'br1',
      'na1',
      'euw1',
      'eun1',
      'kr',
      'kr1',
      'jp1',
      'la1',
      'la2',
      'oc1',
      'tr1',
      'ru1',
   ];

   const isValidString = (str: string, min: number, max: number): boolean =>
      typeof str === 'string' &&
      str.length >= min &&
      str.length <= max &&
      /^[\p{L}\p{N}\p{M} .'\-_!@#$%^&*()+=<>?:;,/\\[\]{}|~`]*$/u.test(str);

   return (
      isValidString(name, 3, 16) &&
      isValidString(tag, 2, 5) &&
      validServers.includes(server.toLowerCase())
   );
}

export function defineSkinPosition(
   skins: { id: string; num: number }[],
   kills: number,
   deaths: number,
   assists: number,
): number {
   const kda = (kills + assists) / Math.max(1, deaths);

   if (kda < 2) return 0;
   if (kda < 4) return skins.length > 1 ? 1 : 0;
   return skins.length > 2 ? 2 : skins.length - 1;
}

function buildAchievements(data: {
   gameMode: string;
   jungleKing: boolean;
   deaths: number;
   killParticipation: number;
   damagePerMinute: number;
   totalDamageTaken: number;
   totalDamageShieldedOnTeammates: number;
   visionScore: number;
   pentaKills: number;
   totalHealsOnTeammates: number;
}): string[] {
   const achievements: string[] = [];

   if (
      data.gameMode === 'CLASSIC' &&
      data.jungleKing &&
      data.deaths === 0 &&
      data.killParticipation >= 60.0
   ) {
      achievements.push('finalBoss');
   }

   if (
      data.deaths === 0 &&
      (data.gameMode === 'CHERRY' || data.killParticipation >= 60.0)
   ) {
      achievements.push('perfectMatch');
   }

   if (
      data.gameMode === 'CLASSIC' &&
      data.jungleKing &&
      data.killParticipation >= 40.0
   ) {
      achievements.push('jungleKing');
   }

   if (
      data.damagePerMinute >= 1000 &&
      (data.gameMode === 'CHERRY' || data.killParticipation >= 40.0)
   ) {
      achievements.push('damageMaster');
   }

   if (
      data.totalDamageTaken >= 10000 &&
      (data.gameMode === 'CHERRY' || data.killParticipation >= 40.0)
   ) {
      achievements.push('tank');
   }

   if (
      data.totalDamageShieldedOnTeammates >= 5000 &&
      (data.gameMode === 'CHERRY' || data.killParticipation >= 40.0)
   ) {
      achievements.push('protector');
   }

   if (data.visionScore >= 80 && data.killParticipation >= 40.0) {
      achievements.push('visionMaster');
   }

   if (data.pentaKills > 0) {
      achievements.push('pentaKill');
   }

   if (
      data.totalHealsOnTeammates >= 5000 &&
      (data.gameMode === 'CHERRY' || data.killParticipation >= 40.0)
   ) {
      achievements.push('healer');
   }

   return achievements;
}

export function createFilteredData(
   matchData: any,
   playerStats: any,
   splashArtUrl: string | null,
   iconChampionUrl: string | null,
) {
   const challenges = playerStats.challenges || {};

   const killParticipation =
      challenges.killParticipation !== undefined
         ? 100 * challenges.killParticipation
         : 0;

   const damagePerMinute =
      challenges.damagePerMinute !== undefined
         ? parseFloat(challenges.damagePerMinute.toFixed(2))
         : 0;

   const jungleKing =
      challenges.dragonTakedowns ===
         matchData.info.teams[0].objectives.dragon.kills +
            matchData.info.teams[1].objectives.dragon.kills &&
      challenges.baronTakedowns ===
         matchData.info.teams[0].objectives.baron.kills +
            matchData.info.teams[1].objectives.baron.kills;

   const achievements = buildAchievements({
      gameMode: matchData.info.gameMode,
      jungleKing,
      deaths: playerStats.deaths,
      killParticipation,
      damagePerMinute,
      totalDamageTaken: playerStats.totalDamageTaken,
      totalDamageShieldedOnTeammates:
         playerStats.totalDamageShieldedOnTeammates,
      visionScore: playerStats.visionScore,
      pentaKills: playerStats.pentaKills,
      totalHealsOnTeammates: playerStats.totalHealsOnTeammates,
   });

   const gameDurationMinutes = matchData.info.gameDuration / 60;

   return {
      matchId: matchData.metadata.matchId,
      gameMode: matchData.info.gameMode,
      championName: playerStats.championName,
      riotIdGameName: playerStats.riotIdGameName,
      riotIdTagline: playerStats.riotIdTagline,
      positionPlayer: playerStats.teamPosition,
      role: playerStats.role,
      realRole: defineRole(
         matchData.info.gameMode,
         playerStats.teamPosition,
         playerStats.role,
      ),

      kills: playerStats.kills,
      deaths: playerStats.deaths,
      assists: playerStats.assists,
      kda: (
         (playerStats.kills + playerStats.assists) /
         Math.max(playerStats.deaths, 1)
      ).toFixed(1),
      killParticipation:
         challenges.killParticipation !== undefined
            ? (100 * challenges.killParticipation).toFixed(2)
            : '0.00',

      totalDamageDealtToChampions: playerStats.totalDamageDealtToChampions,
      totalMinionsKilled: playerStats.totalMinionsKilled,
      totalNeutralMinionsKilled: playerStats.neutralMinionsKilled,
      totalMinionsKilledJg:
         playerStats.totalMinionsKilled + playerStats.neutralMinionsKilled,
      teamId: playerStats.teamId,

      teamDragonsKilled: challenges.dragonTakedowns || 0,
      teamBaronsKilled: challenges.baronTakedowns || 0,
      matchDragons:
         matchData.info.teams[0].objectives.dragon.kills +
         matchData.info.teams[1].objectives.dragon.kills,
      matchBarons:
         matchData.info.teams[0].objectives.baron.kills +
         matchData.info.teams[1].objectives.baron.kills,

      jungleKing:
         challenges.dragonTakedowns ===
            matchData.info.teams[0].objectives.dragon.kills +
               matchData.info.teams[1].objectives.dragon.kills &&
         challenges.baronTakedowns ===
            matchData.info.teams[0].objectives.baron.kills +
               matchData.info.teams[1].objectives.baron.kills,

      gameLength: matchData.info.gameDuration,
      damagePerMinute: challenges.damagePerMinute?.toFixed(2) || '0.00',
      minionsPerMinute: (
         playerStats.totalMinionsKilled / gameDurationMinutes
      ).toFixed(1),
      minionsPerMinuteJg: (
         (playerStats.totalMinionsKilled + playerStats.neutralMinionsKilled) /
         gameDurationMinutes
      ).toFixed(1),
      goldPerMinute: challenges.goldPerMinute?.toFixed(2) || '0.00',

      timeCCingOthers: playerStats.timeCCingOthers,
      visionScore: playerStats.visionScore,

      firstBloodKill: playerStats.firstBloodKill,
      firstBloodAssist: playerStats.firstBloodAssist,
      firstTowerKill: playerStats.firstTowerKill,
      firstTowerAssist: playerStats.firstTowerAssist,

      totalDamageShieldedOnTeammates:
         playerStats.totalDamageShieldedOnTeammates,
      totalHealsOnTeammates: playerStats.totalHealsOnTeammates,
      totalDamageTaken: playerStats.totalDamageTaken,

      baronKills: playerStats.baronKills,
      dragonKills: playerStats.dragonKills,
      quadraKills: playerStats.quadraKills,
      pentaKills: playerStats.pentaKills,

      splashArt: splashArtUrl,
      iconChampion: iconChampionUrl,
      corDaBorda: defineCorDaBordaFrontal(
         playerStats.kills,
         playerStats.deaths,
         playerStats.assists,
      ),
      corDoVerso: defineCorVerso(
         playerStats.kills,
         playerStats.deaths,
         playerStats.assists,
      ),

      perks: {
         defense: getShardIcon(playerStats.perks.statPerks.defense),
         flex: getShardIcon(playerStats.perks.statPerks.flex),
         offense: getShardIcon(playerStats.perks.statPerks.offense),
         primaryStyle: getRuneIconUrl(
            playerStats.perks.styles[0]?.selections[0]?.perk,
         ),
         primaryStyleSec: getRuneIconUrl(
            playerStats.perks.styles[0]?.selections[1]?.perk,
         ),
         primaryStyleTert: getRuneIconUrl(
            playerStats.perks.styles[0]?.selections[2]?.perk,
         ),
         primaryStyleQuat: getRuneIconUrl(
            playerStats.perks.styles[0]?.selections[3]?.perk,
         ),
         subStyle: getRuneIconUrl(
            playerStats.perks.styles[1]?.selections[0]?.perk,
         ),
         subStyleSec: getRuneIconUrl(
            playerStats.perks.styles[1]?.selections[1]?.perk,
         ),
      },

      summonerSpells: {
         spell1: getSummonerSpellIcon(playerStats.summoner1Id),
         spell2: getSummonerSpellIcon(playerStats.summoner2Id),
      },

      items: {
         item0: getItemIcon(playerStats.item0),
         item1: getItemIcon(playerStats.item1),
         item2: getItemIcon(playerStats.item2),
         item3: getItemIcon(playerStats.item3),
         item4: getItemIcon(playerStats.item4),
         item5: getItemIcon(playerStats.item5),
         item6: getItemIcon(playerStats.item6),
      },

      augments: {
         augment1: getAugmentIconUrl(playerStats.playerAugment1),
         augment2: getAugmentIconUrl(playerStats.playerAugment2),
         augment3: getAugmentIconUrl(playerStats.playerAugment3),
         augment4: getAugmentIconUrl(playerStats.playerAugment4),
         augment5: getAugmentIconUrl(playerStats.playerAugment5),
         augment6: getAugmentIconUrl(playerStats.playerAugment6),
      },

      achievements,

      gameDate: new Date(matchData.info.gameStartTimestamp).toLocaleDateString(
         'pt-BR',
         {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
         },
      ),
   };
}
