/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export const CreateRoomSchema = z.object({
  playerName: z
    .string()
    .trim()
    .min(2, { message: 'Username must be at least 2 characters.' })
    .max(16, { message: 'Username must be at most 16 characters.' })
    .regex(/^[a-zA-Z0-9_ -]+$/, { message: 'Username contains invalid characters.' }),
  roomName: z
    .string()
    .trim()
    .min(3, { message: 'Room name must be at least 3 characters.' })
    .max(24, { message: 'Room name must be at most 24 characters.' }),
  maxPlayers: z.number().int().min(2).max(8).default(4),
  password: z.string().trim().max(32).optional(),
  isPublic: z.boolean().default(true),
  avatar: z.string().default('🦊'),
});

export const JoinRoomSchema = z.object({
  playerName: z
    .string()
    .trim()
    .min(2, { message: 'Username must be at least 2 characters.' })
    .max(16, { message: 'Username must be at most 16 characters.' })
    .regex(/^[a-zA-Z0-9_ -]+$/, { message: 'Username contains invalid characters.' }),
  roomCode: z
    .string()
    .trim()
    .toUpperCase()
    .length(6, { message: 'Room code must be exactly 6 characters.' }),
  password: z.string().trim().optional(),
  avatar: z.string().default('🦊'),
});

export const SendMessageSchema = z.object({
  roomId: z.string(),
  message: z
    .string()
    .trim()
    .min(1, { message: 'Message cannot be empty.' })
    .max(200, { message: 'Message cannot exceed 200 characters.' }),
});

export const PlayCardSchema = z.object({
  roomId: z.string(),
  cardId: z.string(),
  chosenColor: z.enum(['red', 'blue', 'green', 'yellow']).optional(),
});

export const ChooseColorSchema = z.object({
  roomId: z.string(),
  color: z.enum(['red', 'blue', 'green', 'yellow']),
});

export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;
export type JoinRoomInput = z.infer<typeof JoinRoomSchema>;
