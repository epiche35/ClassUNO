/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * PostgreSQL / Supabase Schema Definition for classUNO
 * 
 * Run this SQL in your Supabase SQL editor or psql to initialize persistent models:
 */

export const INIT_DB_SQL = `
-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(32) NOT NULL,
  avatar VARCHAR(32) NOT NULL DEFAULT '🦊',
  games_played INT NOT NULL DEFAULT 0,
  games_won INT NOT NULL DEFAULT 0,
  total_score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(16) UNIQUE NOT NULL,
  name VARCHAR(64) NOT NULL,
  host_id VARCHAR(64) NOT NULL,
  max_players INT NOT NULL DEFAULT 4,
  password_hash VARCHAR(128),
  status VARCHAR(32) NOT NULL DEFAULT 'LOBBY',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Games History Table
CREATE TABLE IF NOT EXISTS games (
  id VARCHAR(64) PRIMARY KEY,
  room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE CASCADE,
  winner_id VARCHAR(64),
  total_rounds INT NOT NULL DEFAULT 1,
  scores_json JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_games_room_id ON games(room_id);
`;

export interface UserEntity {
  id: string;
  username: string;
  avatar: string;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  createdAt: Date;
}

export interface RoomEntity {
  id: string;
  code: string;
  name: string;
  hostId: string;
  maxPlayers: number;
  passwordHash?: string;
  status: string;
  createdAt: Date;
}

export interface GameEntity {
  id: string;
  roomId: string;
  winnerId?: string;
  totalRounds: number;
  scoresJson: Record<string, number>;
  createdAt: Date;
}
