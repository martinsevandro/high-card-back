import { Controller, Get, Param } from '@nestjs/common';
import { RiotService } from './riot.service';

@Controller('api')
export class RiotController {
  constructor(private readonly riotService: RiotService) {}

  @Get('player/:name/:tag/:server')
  getPUUID(@Param('name') name: string, @Param('tag') tag: string, @Param('server') server: string) {
    return this.riotService.getAccountByRiotId(name, tag, server);
  }

  @Get('matches/lol/last/:puuid/:server')
  getLastMatchId(@Param('puuid') puuid: string, @Param('server') server: string) {
    return this.riotService.getLastMatchId(puuid, server);
  }

  @Get('matches/lol/last/:puuid/:server/:matchId')
  getMatchDetails(
    @Param('puuid') puuid: string,
    @Param('server') server: string,
    @Param('matchId') matchId: string
  ) {
    return this.riotService.getMatchDetails(puuid, server, matchId);
  }
}
