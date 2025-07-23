import { Injectable } from '@nestjs/common';
import { Player, DuelRoom } from './types/duels.types';
import { UsersService } from 'src/users/users.service';
import { CardsService } from 'src/cards/cards.service';
import { Card } from 'src/cards/schemas/card.schema';

@Injectable()
export class DuelsService {
   private queue: Player[] = [];
   private rooms: Map<string, DuelRoom> = new Map();

   constructor(
      private readonly usersService: UsersService,
      private readonly cardsService: CardsService,
   ) {}

   async getUserDeck(userId: string): Promise<Card[]> {
      return this.cardsService.findAllByUser(userId);
   }

   getAllRooms(): Map<string, DuelRoom> {
      return this.rooms;
   }

   async addToQueue(player: Player): Promise<DuelRoom | null> {
      if (this.queue.some((p) => p.userId === player.userId)) {
         console.log(`Jogador ${player.username} já está na fila.`);
         return null;
      }

      for (const room of this.rooms.values()) {
         if (room.players.some((p) => p.userId === player.userId)) {
            console.log(
               `Jogador ${player.username} já está em uma partida ativa.`,
            );
            return null;
         }
      }

      this.queue.push(player);

      if (this.queue.length >= 2) {
         const [p1, p2] = this.queue.splice(0, 2);
         const room: DuelRoom = {
            roomId: `room-${Date.now()}`,
            players: [p1, p2],
            createdAt: Date.now(),
            scores: {
               [p1.userId]: 0,
               [p2.userId]: 0,
            },
            round: 1,
            roundPlays: [],
         };
         this.rooms.set(room.roomId, room);
         console.log(
            `Duel room created: ${room.roomId} with players ${p1.username} and ${p2.username}`,
         );
         return room;
      }

      return null;
   }

   async getDeckForDuel(userId: string): Promise<Card[]> {
      const deck = await this.cardsService.findAllByUser(userId);
      if (deck.length < 10) {
         throw new Error(
            'O jogador não tem cartas suficientes para iniciar um duelo.',
         );
      }

      return this.sortearTresCartas(deck);
   }

   private sortearTresCartas(deck: Card[]): Card[] {
      const embaralhado = [...deck].sort(() => 0.5 - Math.random());
      return embaralhado.slice(0, 3);
   }

   removeFromQueue(userId: string) {
      this.queue = this.queue.filter((p) => p.userId !== userId);
   }

   removeRoom(roomId: string) {
      this.rooms.delete(roomId);
   }

   getRoomBySocket(socketId: string): DuelRoom | undefined {
      return [...this.rooms.values()].find((room) =>
         room.players.some((p) => p.socketId === socketId),
      );
   }

   getOpponent(socketId: string): Player | undefined {
      const room = this.getRoomBySocket(socketId);
      if (!room) return;
      return room.players.find((p) => p.socketId !== socketId);
   }
}
