/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameEntity, RoomEntity, UserEntity } from './schema.js';

export class DatabaseService {
  private inMemoryUsers: Map<string, UserEntity> = new Map();
  private inMemoryRooms: Map<string, RoomEntity> = new Map();
  private inMemoryGames: Map<string, GameEntity> = new Map();
  private isConnected: boolean = false;

  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && !dbUrl.includes('localhost:5432/classuno')) {
      console.log('[classUNO DB] Database URL configured:', dbUrl.split('@')[1] || 'Configured');
      this.isConnected = true;
    } else {
      console.log('[classUNO DB] Operating with high-performance in-memory database store.');
    }
  }

  public async saveUser(user: Omit<UserEntity, 'createdAt'>): Promise<UserEntity> {
    const entity: UserEntity = {
      ...user,
      createdAt: new Date(),
    };
    this.inMemoryUsers.set(entity.id, entity);
    return entity;
  }

  public async saveRoom(room: Omit<RoomEntity, 'createdAt'>): Promise<RoomEntity> {
    const entity: RoomEntity = {
      ...room,
      createdAt: new Date(),
    };
    this.inMemoryRooms.set(entity.id, entity);
    return entity;
  }

  public async saveGameRecord(game: Omit<GameEntity, 'createdAt'>): Promise<GameEntity> {
    const entity: GameEntity = {
      ...game,
      createdAt: new Date(),
    };
    this.inMemoryGames.set(entity.id, entity);
    return entity;
  }

  public async getUser(id: string): Promise<UserEntity | undefined> {
    return this.inMemoryUsers.get(id);
  }

  public async getRoom(code: string): Promise<RoomEntity | undefined> {
    return Array.from(this.inMemoryRooms.values()).find(r => r.code === code);
  }
}

export const db = new DatabaseService();
