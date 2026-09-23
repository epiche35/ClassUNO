/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage, GameState, Player, Room } from '../../src/types/game.js';
import { GameEngine } from '../engine/GameEngine.js';

export interface RoomRecord {
  id: string;
  code: string;
  name: string;
  hostId: string;
  maxPlayers: number;
  password?: string;
  hasPassword: boolean;
  isPublic: boolean;
  players: Player[];
  createdAt: number;
  engine?: GameEngine;
  chatMessages: ChatMessage[];
  chatRateLimit: Map<string, number[]>; // playerId -> timestamps
  reconnectTimers: Map<string, NodeJS.Timeout>; // playerId -> timer
}

export class RoomManager {
  private rooms: Map<string, RoomRecord> = new Map(); // roomId -> RoomRecord
  private codeToRoomId: Map<string, string> = new Map(); // code -> roomId
  private socketToPlayer: Map<string, { roomId: string; playerId: string }> = new Map();

  public generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit ambiguous 0/O, 1/I
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.codeToRoomId.has(code));
    return code;
  }

  public createRoom(
    name: string,
    playerName: string,
    avatar: string,
    socketId: string,
    maxPlayers: number = 4,
    password?: string,
    isPublic: boolean = true
  ): { room: Room; player: Player } {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const code = this.generateCode();
    const playerId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const hostPlayer: Player = {
      id: playerId,
      socketId,
      name: playerName,
      avatar,
      isHost: true,
      isReady: true,
      isConnected: true,
      cardCount: 0,
      score: 0,
      calledUno: false,
      voiceConnected: false,
      micMuted: false,
      isSpeaking: false,
    };

    const record: RoomRecord = {
      id: roomId,
      code,
      name,
      hostId: playerId,
      maxPlayers: Math.max(2, Math.min(8, maxPlayers)),
      password: password && password.trim() ? password.trim() : undefined,
      hasPassword: Boolean(password && password.trim()),
      isPublic,
      players: [hostPlayer],
      createdAt: Date.now(),
      chatMessages: [],
      chatRateLimit: new Map(),
      reconnectTimers: new Map(),
    };

    this.rooms.set(roomId, record);
    this.codeToRoomId.set(code, roomId);
    this.socketToPlayer.set(socketId, { roomId, playerId });

    return {
      room: this.serializeRoom(record),
      player: hostPlayer,
    };
  }

  public joinRoom(
    code: string,
    playerName: string,
    avatar: string,
    socketId: string,
    password?: string,
    existingPlayerId?: string
  ): { success: boolean; error?: string; room?: Room; player?: Player; isReconnect?: boolean } {
    const roomId = this.codeToRoomId.get(code.toUpperCase().trim());
    if (!roomId) {
      return { success: false, error: 'Room not found. Check the code and try again.' };
    }

    const record = this.rooms.get(roomId);
    if (!record) {
      return { success: false, error: 'Room does not exist.' };
    }

    // Check if this is a reconnecting player
    if (existingPlayerId) {
      const existing = record.players.find(p => p.id === existingPlayerId);
      if (existing) {
        // Clear reconnect timeout if active
        const timer = record.reconnectTimers.get(existingPlayerId);
        if (timer) {
          clearTimeout(timer);
          record.reconnectTimers.delete(existingPlayerId);
        }

        existing.socketId = socketId;
        existing.isConnected = true;
        this.socketToPlayer.set(socketId, { roomId, playerId: existing.id });

        if (record.engine) {
          const engPlayer = record.engine.players.find(p => p.id === existingPlayerId);
          if (engPlayer) {
            engPlayer.socketId = socketId;
            engPlayer.isConnected = true;
          }
        }

        return {
          success: true,
          room: this.serializeRoom(record),
          player: existing,
          isReconnect: true,
        };
      }
    }

    // Password validation
    if (record.hasPassword && record.password) {
      if (!password || password !== record.password) {
        return { success: false, error: 'Incorrect room password.' };
      }
    }

    // Check game in progress
    if (record.engine && record.engine.status === 'PLAYING') {
      return { success: false, error: 'Game is already in progress in this room.' };
    }

    // Check max players
    if (record.players.length >= record.maxPlayers) {
      return { success: false, error: 'This room is currently full.' };
    }

    // Check duplicate name
    const nameConflict = record.players.some(
      p => p.name.trim().toLowerCase() === playerName.trim().toLowerCase() && p.isConnected
    );
    if (nameConflict) {
      return { success: false, error: 'A player with this name is already in the room.' };
    }

    const newPlayerId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newPlayer: Player = {
      id: newPlayerId,
      socketId,
      name: playerName,
      avatar,
      isHost: false,
      isReady: false,
      isConnected: true,
      cardCount: 0,
      score: 0,
      calledUno: false,
      voiceConnected: false,
      micMuted: false,
      isSpeaking: false,
    };

    record.players.push(newPlayer);
    this.socketToPlayer.set(socketId, { roomId, playerId: newPlayerId });

    return {
      success: true,
      room: this.serializeRoom(record),
      player: newPlayer,
    };
  }

  public handleDisconnect(socketId: string): { roomId?: string; playerId?: string; room?: Room; removed?: boolean } {
    const meta = this.socketToPlayer.get(socketId);
    if (!meta) return {};

    const { roomId, playerId } = meta;
    this.socketToPlayer.delete(socketId);

    const record = this.rooms.get(roomId);
    if (!record) return { roomId, playerId };

    const player = record.players.find(p => p.id === playerId);
    if (!player) return { roomId, playerId };

    player.isConnected = false;
    player.voiceConnected = false;
    player.isSpeaking = false;

    // If in active game, give a 45-second reconnect window
    if (record.engine && record.engine.status === 'PLAYING') {
      const timeout = setTimeout(() => {
        this.removePlayer(roomId, playerId);
      }, 45000);
      record.reconnectTimers.set(playerId, timeout);

      return { roomId, playerId, room: this.serializeRoom(record), removed: false };
    } else {
      // In lobby, remove immediately if disconnected
      this.removePlayer(roomId, playerId);
      return { roomId, playerId, room: this.serializeRoom(record), removed: true };
    }
  }

  public leaveRoom(roomId: string, playerId: string): { room?: Room; removed: boolean } {
    return this.removePlayer(roomId, playerId);
  }

  private removePlayer(roomId: string, playerId: string): { room?: Room; removed: boolean } {
    const record = this.rooms.get(roomId);
    if (!record) return { removed: false };

    // Clear reconnect timer
    const timer = record.reconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      record.reconnectTimers.delete(playerId);
    }

    const index = record.players.findIndex(p => p.id === playerId);
    if (index === -1) return { removed: false, room: this.serializeRoom(record) };

    const wasHost = record.players[index].isHost;
    record.players.splice(index, 1);

    // If no players remain, clean up room
    if (record.players.length === 0) {
      this.rooms.delete(roomId);
      this.codeToRoomId.delete(record.code);
      return { removed: true };
    }

    // Transfer host if host left
    if (wasHost && record.players.length > 0) {
      record.players[0].isHost = true;
      record.hostId = record.players[0].id;
    }

    // If game was running and only 1 player remains, conclude round
    if (record.engine && record.engine.status === 'PLAYING') {
      record.engine.players = record.players;
      if (record.players.length < 2) {
        record.engine.status = 'LOBBY';
      }
    }

    return { removed: true, room: this.serializeRoom(record) };
  }

  public setPlayerReady(roomId: string, playerId: string, isReady: boolean): Room | null {
    const record = this.rooms.get(roomId);
    if (!record) return null;

    const player = record.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = isReady;
    }
    return this.serializeRoom(record);
  }

  public updateVoiceStatus(
    roomId: string,
    playerId: string,
    voiceConnected: boolean,
    micMuted?: boolean,
    isSpeaking?: boolean
  ): Room | null {
    const record = this.rooms.get(roomId);
    if (!record) return null;

    const player = record.players.find(p => p.id === playerId);
    if (player) {
      player.voiceConnected = voiceConnected;
      if (micMuted !== undefined) player.micMuted = micMuted;
      if (isSpeaking !== undefined) player.isSpeaking = isSpeaking;
    }
    return this.serializeRoom(record);
  }

  public addChatMessage(roomId: string, playerId: string, text: string): ChatMessage | null {
    const record = this.rooms.get(roomId);
    if (!record) return null;

    const player = record.players.find(p => p.id === playerId);
    if (!player) return null;

    // Rate limiting: max 5 messages per 4 seconds
    const now = Date.now();
    const timestamps = record.chatRateLimit.get(playerId) || [];
    const recent = timestamps.filter(t => now - t < 4000);
    if (recent.length >= 5) {
      return null; // Rate limited
    }
    recent.push(now);
    record.chatRateLimit.set(playerId, recent);

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      roomId,
      playerId,
      playerName: player.name,
      playerAvatar: player.avatar,
      message: text.trim().substring(0, 200),
      timestamp: now,
    };

    record.chatMessages.push(message);
    if (record.chatMessages.length > 60) {
      record.chatMessages.shift();
    }

    return message;
  }

  public addSystemMessage(roomId: string, text: string): ChatMessage | null {
    const record = this.rooms.get(roomId);
    if (!record) return null;

    const message: ChatMessage = {
      id: `sys_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      roomId,
      playerId: 'system',
      playerName: 'classUNO',
      playerAvatar: '🃏',
      message: text,
      timestamp: Date.now(),
      isSystem: true,
    };

    record.chatMessages.push(message);
    return message;
  }

  public startGame(roomId: string, playerId: string): { success: boolean; error?: string; engine?: GameEngine } {
    const record = this.rooms.get(roomId);
    if (!record) return { success: false, error: 'Room not found.' };

    if (record.hostId !== playerId) {
      return { success: false, error: 'Only the host can start the game.' };
    }

    if (record.players.length < 2) {
      return { success: false, error: 'At least 2 players are required to start.' };
    }

    // Initialize or start game engine
    const engine = new GameEngine(roomId, record.code, record.players);
    engine.startRound();
    record.engine = engine;

    return { success: true, engine };
  }

  public getRoom(roomId: string): RoomRecord | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomByCode(code: string): RoomRecord | undefined {
    const roomId = this.codeToRoomId.get(code.toUpperCase().trim());
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  public getPublicRooms(): Room[] {
    const publicList: Room[] = [];
    for (const record of this.rooms.values()) {
      if (record.isPublic && record.players.length > 0) {
        publicList.push(this.serializeRoom(record));
      }
    }
    return publicList;
  }

  public serializeRoom(record: RoomRecord): Room {
    return {
      id: record.id,
      code: record.code,
      name: record.name,
      hostId: record.hostId,
      maxPlayers: record.maxPlayers,
      hasPassword: record.hasPassword,
      isPublic: record.isPublic,
      status: record.engine ? record.engine.status : 'LOBBY',
      players: record.players.map(p => ({
        ...p,
        hand: undefined, // Hands are kept strictly private!
      })),
      createdAt: record.createdAt,
    };
  }
}
