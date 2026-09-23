/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardType = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export interface Card {
  id: string;
  color: CardColor;
  type: CardType;
  value?: number; // 0-9 for number cards
}

export interface Player {
  id: string;
  socketId: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  cardCount: number;
  score: number;
  calledUno: boolean;
  voiceConnected?: boolean;
  micMuted?: boolean;
  isSpeaking?: boolean;
  hand?: Card[]; // Only sent to the owner player!
}

export type GameStatus = 'LOBBY' | 'STARTING' | 'PLAYING' | 'ROUND_END' | 'GAME_END';

export interface Room {
  id: string;
  code: string;
  name: string;
  hostId: string;
  maxPlayers: number;
  hasPassword: boolean;
  isPublic: boolean;
  status: GameStatus;
  players: Player[];
  createdAt: number;
}

export interface GameActionLog {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  type: 'play' | 'draw' | 'uno' | 'skip' | 'reverse' | 'penalty' | 'win' | 'color';
  timestamp: number;
}

export interface GameState {
  roomId: string;
  roomCode: string;
  status: GameStatus;
  players: Player[];
  currentPlayerId: string;
  turnIndex: number;
  turnDirection: 1 | -1; // 1 = clockwise, -1 = counter-clockwise
  currentColor: 'red' | 'blue' | 'green' | 'yellow';
  currentCard: Card;
  drawPileCount: number;
  discardPileCount: number;
  winnerId?: string;
  roundWinnerId?: string;
  roundScores?: Record<string, number>;
  totalScores?: Record<string, number>;
  lastAction?: GameActionLog;
  wildPickerPlayerId?: string; // Set when waiting for wild color choice
  myHand?: Card[]; // Injected per player connection
  unoCallers?: string[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface VoiceSignalPayload {
  roomId: string;
  fromPlayerId: string;
  targetPlayerId: string;
  signal: any;
}
