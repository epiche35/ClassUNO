/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { io, Socket } from 'socket.io-client';
import { ChatMessage, GameState, Player, Room } from '../types/game.js';
import { soundManager } from './audio.js';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

    socketInstance = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected with ID:', socketInstance?.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
    });
  }
  return socketInstance;
}

export interface SessionData {
  roomCode: string;
  roomId: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
}

export function saveSession(data: SessionData) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('classuno_session', JSON.stringify(data));
  }
}

export function getSavedSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem('classuno_session');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('classuno_session');
  }
}
