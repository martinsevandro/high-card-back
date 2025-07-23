import {
   WebSocketGateway,
   WebSocketServer,
   SubscribeMessage,
   MessageBody,
   ConnectedSocket,
   OnGatewayConnection,
   OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DuelsService } from './duels.service';
import { Player, DuelRoom, Card } from './types/duels.types';

@WebSocketGateway({ cors: true })
export class DuelsGateway implements OnGatewayConnection, OnGatewayDisconnect {
   @WebSocketServer() server: Server;

   constructor(private readonly duelsService: DuelsService) {}

   async handleConnection(socket: Socket) {
      console.log(`Cliente conectado - socket: ${socket.id}`);
   }

   async handleDisconnect(socket: Socket) {
      const disconnectedId = socket.id;

      const rooms = this.duelsService.getAllRooms();

      const room = Array.from(rooms.values()).find((r) =>
         r.players.some((p) => p.socketId === disconnectedId),
      );

      if (!room){
         this.duelsService.removeFromQueue(disconnectedId);
         return;
      }

      const player1 = room.players[0];
      const player2 = room.players[1];

      const remainingPlayer =
         player1.socketId === disconnectedId ? player2 : player1;
      const remainingId = remainingPlayer.socketId;

      const scores = room.scores ?? {};
      const disconnectedScore = scores[disconnectedId] ?? 0;
      const remainingScore = scores[remainingId] ?? 0;

      let finalResult: string;
      let winnerSocketId: string | null = null;
      if (remainingScore > disconnectedScore) {
         finalResult = `${remainingPlayer.username} venceu o duelo por abandono!`;
         winnerSocketId = remainingId;
      } else {
         finalResult = `O duelo terminou empatado!`;
         winnerSocketId = null;
      }

      this.server.to(room.roomId).emit('duelEnded', {
         finalResult,
         scores,
         winnerSocketId,
      });

      this.duelsService.removeRoom(room.roomId);

      this.duelsService.removeFromQueue(disconnectedId);
   }

   @SubscribeMessage('join_duel_queue')
   async handleJoinQueue(
      @MessageBody() data: { userId: string; username: string },
      @ConnectedSocket() client: Socket,
   ) {
      const { userId, username } = data;

      try {
         const deck = await this.duelsService.getUserDeck(userId);

         if (deck.length < 10) {
            client.emit(
               'error',
               'Você precisa de pelo menos 10 cartas para entrar em um duelo.',
            );
            return;
         }

         const player: Player = {
            socketId: client.id,
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
               client.emit(
                  'error',
                  'Você não pode entrar em um duelo contra si mesmo.',
               );
               return;
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
               room.scores = { [player1.socketId]: 0, [player2.socketId]: 0 };

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
         console.error(err);
         client.emit('error', 'Erro ao tentar entrar na fila.');
      }
   }

   @SubscribeMessage('playCard')
   async handlePlayCard(
      @MessageBody() data: { selectedCard: Card },
      @ConnectedSocket() client: Socket,
   ) {
      const room = this.duelsService.getRoomBySocket(client.id);
      if (!room) {
         client.emit('error', 'Sala não encontrada.');
         return;
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
         (c) => c.id === currentRound.playerCardId,
      );
      const card2 = player2.hand.find(
         (c) => c.id === currentRound.opponentCardId,
      );

      const kda1 = parseFloat(card1?.kda || '0');
      const kda2 = parseFloat(card2?.kda || '0');

      let result: string;

      if (!room.scores)
         room.scores = {
            [player1.socketId]: 0,
            [player2.socketId]: 0,
         };

      if (kda1 > kda2) {
         room.scores[player1.socketId]++;
         result = `${player1.username} venceu a rodada ${room.round}`;
         console.log(
            `Rodada ${room.round} - ${player1.username} venceu com KDA ${kda1} contra ${player2.username} com KDA ${kda2}`,
         );
      } else if (kda2 > kda1) {
         room.scores[player2.socketId]++;
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

      this.server.to(player1.socketId).emit('roundResult', {
         yourCard: card1,
         opponentCard: card2,
         result,
         scores: room.scores,
      });

      this.server.to(player2.socketId).emit('roundResult', {
         yourCard: card2,
         opponentCard: card1,
         result,
         scores: room.scores,
      });

      const score1 = room.scores[player1.socketId];
      const score2 = room.scores[player2.socketId];

      if (score1 === 2 || score2 === 2 || room.round >= 4) {
         let finalResult: string;
         let winnerSocketId: string | null = null;
         if (score1 > score2) {
            finalResult = `${player1.username} venceu o duelo!`;
            winnerSocketId = player1.socketId;
         } else if (score2 > score1) {
            finalResult = `${player2.username} venceu o duelo!`;
            winnerSocketId = player2.socketId;
         } else {
            finalResult = 'Duelo empatado!';
         }

         console.log('Emitindo evento duelEnded:', {
            finalResult,
            scores: room.scores,
         });
         this.server.to(room.roomId).emit('duelEnded', {
            finalResult,
            scores: room.scores,
            winnerSocketId,
         });

         this.duelsService.removeRoom(room.roomId);
      } else {
         console.log(
            'Hand antes:',
            player1.hand.map((c) => c._id),
         );
         console.log('Removendo id:', currentRound.playerCardId);

         player1.hand = player1.hand.filter(
            (c) => c._id.toString() !== currentRound.playerCardId,
         );
         player2.hand = player2.hand.filter(
            (c) => c._id.toString() !== currentRound.opponentCardId,
         );

         room.round++;

         room.roundPlays = [];

         if (room.round <= 3) {
            console.log('Iniciando nova rodada:', room.round);
            console.log(
               `Nova Mão do ${player1.username}:`,
               player1.hand.map((c) => c.kda),
            );
            this.server.to(player1.socketId).emit('nextRound', {
               round: room.round,
               deck: player1.hand,
            });
            console.log(
               `Nova Mão do ${player2.username}:`,
               player2.hand.map((c) => c.kda),
            );
            this.server.to(player2.socketId).emit('nextRound', {
               round: room.round,
               deck: player2.hand,
            });
         }
      }
   }

   @SubscribeMessage('leave_duel_queue')
   async onLeaveQueue(client: Socket) {
      this.duelsService.removeFromQueue(client.id);
      client.emit('queue_left');

      console.log(
         'Fila atual:',
         this.duelsService['queue'].map((p) => p.userId),
      );
 
   }

   @SubscribeMessage('select_card')
   async onSelectCard(client: Socket, payload: { card: any }) {
      const room = this.duelsService.getRoomBySocket(client.id);
      if (!room) return;

      const player = room.players.find((p) => p.socketId === client.id);
      if (!player) return;

      player.deck = player.deck.filter((c) => c.id !== payload.card.id);

      client.emit('card_selected_ack', {
         select: payload.card,
         remainingDeck: player.deck,
      });
   }
}
