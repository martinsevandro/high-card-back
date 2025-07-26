import { Card } from '../../cards/schemas/card.schema';

export interface Player {
   socketId: string;
   userId: string;
   username: string;
   deck: Card[];
   hand: Card[];
   score: number;
}

export interface DuelRoom {
   roomId: string;
   players: [Player, Player];
   createdAt: number;
   scores: Record<string, number>;
   round: number;
   roundPlays: Round[];
}

interface Round {
   roundNumber: number;
   winnerSocketId?: string;
   playerCardId: string;
   opponentCardId: string;
}
