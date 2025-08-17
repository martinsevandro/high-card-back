import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { RiotService } from './riot.service';

@Controller('api')
export class RiotController {
   constructor(private readonly riotService: RiotService) {}

   @Get('player/:name/:tag/:server')
   getPUUID(
      @Param('name') name: string,
      @Param('tag') tag: string,
      @Param('server') server: string,
   ) {
      return this.riotService.getAccountByRiotId(name, tag, server);
   }

   @Get('matches/lol/latest/:puuid/:server')
   async getLatestMatchDetails(
      @Param('puuid') puuid: string,
      @Param('server') server: string,
   ) {
      const matchIdResponse = await this.riotService.getLastMatchId(
         puuid,
         server,
      );
      const lastMatchId = matchIdResponse;

      // console.log(`Último ID de partida: ${lastMatchId}`);

      if (!lastMatchId) {
         throw new NotFoundException('Nenhuma partida encontrada..');
      }

      const matchDetails = await this.riotService.getMatchDetails(
         puuid,
         server,
         lastMatchId,
      );
      return matchDetails;
   }

   @Get('matches/lol/specific/:puuid/:server/:matchId')
   getSpecificMatchDetails(
      @Param('puuid') puuid: string,
      @Param('server') server: string,
      @Param('matchId') matchId: string,
   ) {
      return this.riotService.getMatchDetails(puuid, server, matchId);
   }
}
