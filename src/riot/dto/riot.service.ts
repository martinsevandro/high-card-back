import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { getRegionalRoute, isValidRiotId, defineSkinPosition, createFilteredData } from '../utils/riot.utils';    

@Injectable()
export class RiotService {
  private readonly apiKey = process.env.RIOT_API_KEY;

  constructor(private readonly httpService: HttpService) {}

  async getAccountByRiotId(name: string, tag: string, server: string) {
    const regionalRoute = getRegionalRoute(server);
    if (!isValidRiotId(name, tag, server)) {
      throw new HttpException('Parâmetros inválidos', HttpStatus.BAD_REQUEST);
    }

    if (!regionalRoute) {
      throw new HttpException('Servidor inválido', HttpStatus.BAD_REQUEST);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://${regionalRoute}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${name}/${tag}`,
          {
            headers: { 'X-Riot-Token': this.apiKey },
            validateStatus: () => true,
            timeout: 5000,
          },
        ),
      );

      if (response.status === 403) {
        throw new HttpException('Acesso negado. Verifique sua API Key.', HttpStatus.FORBIDDEN);
      }

      if (response.status === 404) {
        throw new HttpException('Jogador não encontrado.', HttpStatus.NOT_FOUND);
      }

      if (!response.data?.puuid) {
        throw new HttpException('PUUID não encontrado na resposta.', response.status);
      }

      return response.data;
    } catch (err) {
      throw new HttpException(err.response?.data?.status?.message || err.message, err.response?.status || 500);
    }
  }

  async getLastMatchId(puuid: string, server: string) {
    const regionalRoute = getRegionalRoute(server);
    if (!/^[a-zA-Z0-9\-_]{30,100}$/.test(puuid)) {
      throw new HttpException('PUUID inválido', HttpStatus.BAD_REQUEST);
    }
    if (!regionalRoute) {
      throw new HttpException('Servidor inválido', HttpStatus.BAD_REQUEST);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://${regionalRoute}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=1`,
          {
            headers: { 'X-Riot-Token': this.apiKey },
            validateStatus: () => true,
            timeout: 5000,
          },
        ),
      );

      if (response.status === 403) {
        throw new HttpException('Acesso negado pela Riot API', HttpStatus.FORBIDDEN);
      }

      const [matchId] = response.data || [];

      console.log(`Último_ID de partida: ${matchId}`);

      if (!matchId) {
        throw new HttpException('Nenhuma partida encontrada.', HttpStatus.NOT_FOUND);
      }

      return matchId;
    } catch (err) {
      throw new HttpException(err.response?.data?.status?.message || err.message, err.response?.status || 500);
    }
  }

  async getMatchDetails(puuid: string, server: string, matchId: string) {
    const regionalRoute = getRegionalRoute(server);

    if (!/^[a-zA-Z0-9\-_]{30,100}$/.test(puuid)) {
      throw new HttpException('PUUID inválido', HttpStatus.BAD_REQUEST);
    }

    if (!/^[A-Z0-9]{2,4}_\d{5,}$/.test(matchId)) {
      throw new HttpException('matchId inválido', HttpStatus.BAD_REQUEST);
    }

    if (!regionalRoute) {
      throw new HttpException('Servidor inválido', HttpStatus.BAD_REQUEST);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://${regionalRoute}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
          {
            headers: { 'X-Riot-Token': this.apiKey },
            validateStatus: () => true,
            timeout: 5000,
          },
        ),
      );

      if (response.status === 403) {
        throw new HttpException('Acesso negado à partida', HttpStatus.FORBIDDEN);
      }

      const matchData = response.data;
      const playerStats = matchData.info.participants.find(
        (p: { puuid: string }) => p.puuid === puuid);
      if (!playerStats) {
        throw new HttpException('Jogador não encontrado na partida.', HttpStatus.NOT_FOUND);
      }

      const duoStats = matchData.info.participants.find(
        (p: { puuid: string; subteamPlacement: number }) =>
            p.puuid !== puuid && p.subteamPlacement === playerStats.subteamPlacement,
      );

      const champRes = await firstValueFrom(
        this.httpService.get(
          `http://ddragon.leagueoflegends.com/cdn/15.8.1/data/en_US/champion/${playerStats.championName}.json`,
        ),
      );

      const skins = champRes.data.data[playerStats.championName].skins;
      const skinPosition = defineSkinPosition(skins, playerStats.kills, playerStats.deaths, playerStats.assists);
      const selectedSkinNum = skins[skinPosition]?.num ?? skins[0].num;

      const splashArtUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${playerStats.championName}_${selectedSkinNum}.jpg`;
      const iconChampionUrl = duoStats
        ? `https://ddragon.leagueoflegends.com/cdn/15.8.1/img/champion/${duoStats.championName}.png`
        : null;

      return createFilteredData(matchData, playerStats, splashArtUrl, iconChampionUrl);
    } catch (err) {
      throw new HttpException(err.response?.data?.status?.message || err.message, err.response?.status || 500);
    }
  }
}
