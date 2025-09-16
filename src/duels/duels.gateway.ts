import {
   WebSocketGateway,
   WebSocketServer,
   SubscribeMessage,
   MessageBody,
   ConnectedSocket,
   OnGatewayConnection,
   OnGatewayDisconnect,
   WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DuelsService } from './duels.service';
import { Player } from './types/duels.types';
import { Card } from '../cards/schemas/card.schema';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { sanitizeCard, sanitizePlayer, sanitizeRoundResult } from './utils/duels.utils';

const allowedOrigins =
  process.env.CORS_ORIGIN?.split(',').map(o => o.trim()).filter(Boolean) ?? [];

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);

      if (origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`Origin bloqueada: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: false,
  },
})

export class DuelsGateway implements OnGatewayConnection, OnGatewayDisconnect {
   @WebSocketServer() server: Server;

   constructor(
      private readonly duelsService: DuelsService,
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService,
   ) {}

   async handleConnection(socket: Socket) {
      console.log(`Cliente conectado - socket: ${socket.id}`);

      const token = socket.handshake.auth?.token;

      if (!token) {
         console.error(`[${socket.id}] Token faltando na conexão websocket`);
         socket.emit('auth_error', { message: 'Problema na autenticação!' });
         socket.disconnect();
         return;
      }

      try {
         const payload = this.jwtService.verify(token, {
            secret: this.configService.get<string>('JWT_SECRET'),
         });

         socket.data.userId = payload.sub;
         socket.data.username = payload.username;

         console.log(
            `socket conectado: ${socket.id} | usuário: ${payload.username}`,
         );
      } catch (err: any) {
         if (err.name === 'TokenExpiredError') {
            console.warn(`[${socket.id}] Token expirado na conexão websocket`);
         } else if (err.name === 'JsonWebTokenError') {
            console.warn(`[${socket.id}] Token inválido: ${err.message}`);
         } else if (err.name === 'NotBeforeError') {
            console.warn(`[${socket.id}] Token não ativo ainda.`);
         } else {
            console.error(`[${socket.id}] Erro ao verificar token: `, err);
         }

         socket.emit('auth_error', { message: 'Erro na autenticação. Faça login novamente.' });
         socket.disconnect();
      }
   }

   async handleDisconnect(socket: Socket) {
      const disconnectedId = socket.id;
      const disconnectedUserId = socket.data.userId;

      const rooms = this.duelsService.getAllRooms();

      const room = Array.from(rooms.values()).find((r) =>
         r.players.some((p) => p.socketId === disconnectedId),
      );

      if (!room) {
         if (disconnectedUserId) {
            this.duelsService.removeFromQueue(disconnectedUserId);
         }
         return;
      }

      const scores = room.scores ?? {};
      const disconnectedPlayer = room.players.find(p => p.socketId === disconnectedId);
      const remainingPlayer = room.players.find(p => p.socketId !== disconnectedId);

      const disconnectedScore = scores[disconnectedPlayer?.username || ''] ?? 0;
      const remainingScore = scores[remainingPlayer?.username || ''] ?? 0;

      let finalResult: string;
      let winnerUsername: string | null = null;

      console.log(`handleDisconnect -> disconnectedScore=${disconnectedScore}, remainingScore=${remainingScore}`);

      if (remainingScore > disconnectedScore) {
         finalResult = `Você venceu! O oponente se desconectou.`;
         winnerUsername = remainingPlayer?.username ?? null;
      } else {
         finalResult = `Duelo empatou! O oponente se desconectou.`;
         winnerUsername = null;
      }

      this.server.to(room.roomId).emit('duelEnded', {
         finalResult,
         scores,
         winner: winnerUsername ? { username: winnerUsername } : null,
      });

      this.duelsService.removeRoom(room.roomId);

      if (disconnectedUserId) {
         this.duelsService.removeFromQueue(disconnectedUserId);
      }
   }

   @SubscribeMessage('join_duel_queue')
   async handleJoinQueue(@ConnectedSocket() client: Socket) {
      const userId = client.data.userId;
      const username = client.data.username;
      const socketId = client.id;

      try {
         const deck = await this.duelsService.getUserDeck(userId);

         if (deck.length < 10) {
            console.log('entrou no if do deck < 10');
            throw new WsException({
               code: 'INSUFFICIENT_DECK'
            });
         }

         const player: Player = {
            socketId,
            userId,
            username,
            deck: deck.slice(0, 10),
            hand: [],
            score: 0,
         };

         console.log(
            `Jogador ${username} (${userId}) entrou na fila de duelos.`,
         );

         const room = await this.duelsService.addToQueue(player);

         console.log(
            'usuarios na fila:',
            this.duelsService['queue'].map((p) => p.username),
         );

         client.emit('waiting_for_opponent');

         if (room) {
            const [player1, player2] = room.players;

            if (player1.userId === player2.userId) {
               this.duelsService.removeRoom(room.roomId);
               // client.emit(
               //    'error',
               //    'Você não pode entrar em um duelo contra si mesmo.',
               // );
               // return;

               throw new WsException({
                  code: 'ONESELF_DUEL'
               });
            }

            const client1 = this.server.sockets.sockets.get(player1.socketId);
            const client2 = this.server.sockets.sockets.get(player2.socketId);

            if (client1 && client2) {
               client1.join(room.roomId);
               client2.join(room.roomId);

               const hand1 = await this.duelsService.getDeckForDuel(
                  player1.userId,
               );
               const hand2 = await this.duelsService.getDeckForDuel(
                  player2.userId,
               );

               player1.hand = hand1;
               player2.hand = hand2;

               console.log(
                  'hand1:',
                  player1.hand.map((c) => c.kda),
               );
               console.log(
                  'hand2:',
                  player2.hand.map((c) => c.kda),
               );

               room.players = [player1, player2];
               room.round = 1;
               room.scores = { [player1.username]: 0, [player2.username]: 0 };

               this.server.to(player1.socketId).emit('duel_start', {
                  roomId: room.roomId,
                  opponent: player2.username,
                  deck: player1.hand,
               });
               this.server.to(player2.socketId).emit('duel_start', {
                  roomId: room.roomId,
                  opponent: player1.username,
                  deck: player2.hand,
               });
            }
         }
      } catch (err) {
         if (err instanceof WsException) {
            throw err;
         }

         throw new WsException({
            code: 'QUEUE_JOIN_FAILED'
         });
      }
   }

   @SubscribeMessage('playCard')
   async handlePlayCard(
      @MessageBody() data: { selectedCard: Card },
      @ConnectedSocket() client: Socket,
   ) {
      const room = this.duelsService.getRoomBySocket(client.id);
      if (!room) {
         throw new WsException({
            code: 'ROOM_NOT_FOUND'
         });
      }
      console.log('Room:', room.roomId);

      const player1 = room.players[0];
      const player2 = room.players[1];

      if (!player1 || !player2) return;

      if (room.round === undefined) room.round = 1;
      if (!room.roundPlays) room.roundPlays = [];

      let currentRound = room.roundPlays.find(
         (r) => r.roundNumber === room.round,
      );

      if (!currentRound) {
         currentRound = {
            roundNumber: room.round,
            playerCardId: '',
            opponentCardId: '',
         };
         room.roundPlays.push(currentRound);
      }

      if (!data.selectedCard._id) {
         throw new WsException({
            code: 'CARD_NOT_FOUND'
         });
      }

      if (client.id === player1.socketId && !currentRound.playerCardId) {
         currentRound.playerCardId = data.selectedCard._id.toString();
      } else if (
         client.id === player2.socketId &&
         !currentRound.opponentCardId
      ) {
         currentRound.opponentCardId = data.selectedCard._id.toString();
      }

      console.log('Current round:', room.round);

      console.log(
         `Received from: ${client.id} Card id: ${data.selectedCard._id} com KDA: ${data.selectedCard.kda}`,
      );
      console.log('Round state:', currentRound);

      if (!currentRound.playerCardId || !currentRound.opponentCardId) return;

      const card1 = player1.hand.find(
         (c) => c._id?.toString() === currentRound.playerCardId,
      );
      const card2 = player2.hand.find(
         (c) => c._id?.toString() === currentRound.opponentCardId,
      );

      if (!card1 || !card2) throw new Error(`Erro interno: carta não encontrada para a rodada`);
      
      const kda1 = parseFloat(card1?.kda || '0');
      const kda2 = parseFloat(card2?.kda || '0');

      let result: string;

      if (!room.scores)
         room.scores = {
            [player1.username]: 0,
            [player2.username]: 0,
         };

      if (kda1 > kda2) {
         room.scores[player1.username]++;
         result = `${player1.username} venceu a rodada ${room.round}`;
         console.log(
            `Rodada ${room.round} - ${player1.username} venceu com KDA ${kda1} contra ${player2.username} com KDA ${kda2}`,
         );
      } else if (kda2 > kda1) {
         room.scores[player2.username]++;
         result = `${player2.username} venceu a rodada ${room.round}`;
         console.log(
            `Rodada ${room.round} - ${player2.username} venceu com KDA ${kda2} contra ${player1.username} com KDA ${kda1}`,
         );
      } else {
         result = `Rodada ${room.round} empatada`;
         console.log(
            `Rodada ${room.round} - Empate com KDA ${kda1} para ambos os jogadores`,
         );
      }

      console.log('antes do roundResult.emit -> scores:', room.scores);

      console.log('Emitindo roundResult', {
         round: room.round,
         card1KDA: kda1,
         card2KDA: kda2,
         result,
         scores: room.scores,
      });

      this.server.to(room.roomId).emit('roundSummary', {
         round: room.round,
         card1KDA: kda1,
         card2KDA: kda2,
         result,
         scores: room.scores,
      });

      this.server.to(player1.socketId).emit('roundResult', 
         sanitizeRoundResult(card1, card2, result, room.scores)
      );

      this.server.to(player2.socketId).emit('roundResult', 
         sanitizeRoundResult(card2, card1, result, room.scores)
      );

      const score1 = room.scores[player1.username];
      const score2 = room.scores[player2.username];

      if (score1 === 2 || score2 === 2 || room.round === 3) {
         const winner = score1 > score2 ? player1 : score2 > score1 ? player2 : null;

         room.players.forEach(player => {
            let message: string;
            if (!winner) {
               message = 'Duelo empatado!';
            } else if (player.username === winner.username) {
               message = 'Você venceu o duelo!';
            } else {
               message = 'Você perdeu o duelo!';
            }

            this.server.to(player.socketId).emit('duelEnded', {
               finalResult: message,
               scores: room.scores,
               winner: winner ? { username: winner.username } : null,
            });
         });

         this.duelsService.removeRoom(room.roomId);
      } else {
         console.log(
            'Hand antes:',
            player1.hand.map((c) => c._id),
         );
         console.log('Removendo id:', currentRound.playerCardId);

         player1.hand = player1.hand.filter(
            (c) => c._id?.toString() !== currentRound.playerCardId,
         );
         player2.hand = player2.hand.filter(
            (c) => c._id?.toString() !== currentRound.opponentCardId,
         );

         room.round++;

         room.roundPlays = [];

         console.log('Iniciando nova rodada:', room.round);
         console.log(
            `Nova Mão do ${player1.username}:`,
            player1.hand.map((c) => c.kda),
         );
         this.server.to(player1.socketId).emit('nextRound', {
            round: room.round,
            deck: player1.hand.map((c) => sanitizeCard(c)),
         });
         console.log(
            `Nova Mão do ${player2.username}:`,
            player2.hand.map((c) => c.kda),
         );
         this.server.to(player2.socketId).emit('nextRound', {
            round: room.round,
            deck: player2.hand.map((c) => sanitizeCard(c)),
         });
      }
   }

   @SubscribeMessage('leave_duel_queue')
   async onLeaveQueue(client: Socket) {
      this.duelsService.removeFromQueue(client.data.userId);
      client.emit('queue_left');

      console.log(
         'Fila atual:',
         this.duelsService['queue'].map((p) => p.userId),
      );
   }
}
