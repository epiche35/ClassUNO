/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Server, Socket } from 'socket.io';
import {
  ChooseColorSchema,
  CreateRoomSchema,
  JoinRoomSchema,
  PlayCardSchema,
  SendMessageSchema,
} from '../../src/lib/validation.js';
import { VoiceSignalPayload } from '../../src/types/game.js';
import { RoomManager } from '../rooms/RoomManager.js';

export function setupSocket(io: Server, roomManager: RoomManager) {
  // Helper to broadcast game state properly to each player with only their hand
  const broadcastGameState = (roomId: string) => {
    const record = roomManager.getRoom(roomId);
    if (!record || !record.engine) return;

    for (const player of record.players) {
      if (player.socketId) {
        const sanitized = record.engine.getSanitizedStateForPlayer(player.id);
        io.to(player.socketId).emit('game:state', sanitized);
      }
    }
  };

  const broadcastRoomUpdate = (roomId: string) => {
    const record = roomManager.getRoom(roomId);
    if (!record) return;
    const room = roomManager.serializeRoom(record);
    io.to(roomId).emit('room:update', room);
  };

  io.on('connection', (socket: Socket) => {
    // 1. Create Room
    socket.on('room:create', (payload, callback) => {
      try {
        const parseResult = CreateRoomSchema.safeParse(payload);
        if (!parseResult.success) {
          return callback?.({
            success: false,
            error: parseResult.error.issues[0]?.message || 'Invalid input.',
          });
        }

        const data = parseResult.data;
        const { room, player } = roomManager.createRoom(
          data.roomName,
          data.playerName,
          data.avatar,
          socket.id,
          data.maxPlayers,
          data.password,
          data.isPublic
        );

        socket.join(room.id);

        callback?.({
          success: true,
          room,
          player,
        });

        // Broadcast to public room listings if public
        io.emit('rooms:public', roomManager.getPublicRooms());
      } catch (err: any) {
        callback?.({ success: false, error: err.message || 'Failed to create room.' });
      }
    });

    // 2. Join Room
    socket.on('room:join', (payload, callback) => {
      try {
        const parseResult = JoinRoomSchema.safeParse(payload);
        if (!parseResult.success) {
          return callback?.({
            success: false,
            error: parseResult.error.issues[0]?.message || 'Invalid join parameters.',
          });
        }

        const data = parseResult.data;
        const existingPlayerId = payload.existingPlayerId;

        const result = roomManager.joinRoom(
          data.roomCode,
          data.playerName,
          data.avatar,
          socket.id,
          data.password,
          existingPlayerId
        );

        if (!result.success || !result.room || !result.player) {
          return callback?.({ success: false, error: result.error });
        }

        socket.join(result.room.id);

        callback?.({
          success: true,
          room: result.room,
          player: result.player,
          chatHistory: roomManager.getRoom(result.room.id)?.chatMessages || [],
        });

        // Announce join
        const sysMsg = roomManager.addSystemMessage(
          result.room.id,
          `${result.player.name} joined the room!`
        );
        if (sysMsg) io.to(result.room.id).emit('chat:new', sysMsg);

        broadcastRoomUpdate(result.room.id);

        // If game in progress, send current game state to reconnected player
        const record = roomManager.getRoom(result.room.id);
        if (record && record.engine) {
          broadcastGameState(result.room.id);
        }
      } catch (err: any) {
        callback?.({ success: false, error: err.message || 'Failed to join room.' });
      }
    });

    // 3. Player Ready
    socket.on('player:ready', ({ roomId, playerId, isReady }) => {
      const room = roomManager.setPlayerReady(roomId, playerId, isReady);
      if (room) {
        io.to(roomId).emit('room:update', room);
      }
    });

    // 4. Start Game
    socket.on('game:start', ({ roomId, playerId }, callback) => {
      const result = roomManager.startGame(roomId, playerId);
      if (!result.success) {
        return callback?.({ success: false, error: result.error });
      }

      broadcastRoomUpdate(roomId);
      broadcastGameState(roomId);

      const sysMsg = roomManager.addSystemMessage(roomId, 'Game started! Good luck to all players.');
      if (sysMsg) io.to(roomId).emit('chat:new', sysMsg);

      callback?.({ success: true });
    });

    // 5. Play Card
    socket.on('game:play-card', (payload, callback) => {
      const parse = PlayCardSchema.safeParse(payload);
      if (!parse.success) {
        return callback?.({ success: false, error: parse.error.issues[0]?.message });
      }

      const { roomId, cardId, chosenColor } = parse.data;
      const record = roomManager.getRoom(roomId);
      if (!record || !record.engine) {
        return callback?.({ success: false, error: 'Active game not found.' });
      }

      const playResult = record.engine.playCard(payload.playerId, cardId, chosenColor);
      if (!playResult.success) {
        return callback?.({ success: false, error: playResult.error });
      }

      broadcastGameState(roomId);
      broadcastRoomUpdate(roomId);
      callback?.({ success: true });
    });

    // 6. Choose Wild Color
    socket.on('game:choose-color', (payload, callback) => {
      const parse = ChooseColorSchema.safeParse(payload);
      if (!parse.success) {
        return callback?.({ success: false, error: parse.error.issues[0]?.message });
      }

      const { roomId, color } = parse.data;
      const record = roomManager.getRoom(roomId);
      if (!record || !record.engine) {
        return callback?.({ success: false, error: 'Active game not found.' });
      }

      const res = record.engine.chooseWildColor(payload.playerId, color);
      if (!res.success) {
        return callback?.({ success: false, error: res.error });
      }

      broadcastGameState(roomId);
      broadcastRoomUpdate(roomId);
      callback?.({ success: true });
    });

    // 7. Draw Card
    socket.on('game:draw-card', ({ roomId, playerId }, callback) => {
      const record = roomManager.getRoom(roomId);
      if (!record || !record.engine) {
        return callback?.({ success: false, error: 'Active game not found.' });
      }

      const res = record.engine.drawCard(playerId);
      if (!res.success) {
        return callback?.({ success: false, error: res.error });
      }

      broadcastGameState(roomId);
      callback?.({ success: true, card: res.card });
    });

    // 8. Call UNO
    socket.on('game:uno', ({ roomId, playerId }, callback) => {
      const record = roomManager.getRoom(roomId);
      if (!record || !record.engine) {
        return callback?.({ success: false, message: 'Game not active.' });
      }

      const res = record.engine.callUno(playerId);
      broadcastGameState(roomId);
      callback?.(res);
    });

    // 9. Challenge UNO
    socket.on('game:challenge-uno', ({ roomId, challengerId, targetPlayerId }, callback) => {
      const record = roomManager.getRoom(roomId);
      if (!record || !record.engine) {
        return callback?.({ success: false, message: 'Game not active.' });
      }

      const res = record.engine.challengeUno(challengerId, targetPlayerId);
      broadcastGameState(roomId);
      callback?.(res);
    });

    // 10. Rematch
    socket.on('game:rematch', ({ roomId, playerId }, callback) => {
      const record = roomManager.getRoom(roomId);
      if (!record) return callback?.({ success: false, error: 'Room not found.' });
      if (record.hostId !== playerId) {
        return callback?.({ success: false, error: 'Only the host can initiate a rematch.' });
      }

      record.engine?.startRound();
      broadcastGameState(roomId);
      broadcastRoomUpdate(roomId);

      const sysMsg = roomManager.addSystemMessage(roomId, 'New round started! Rematch underway.');
      if (sysMsg) io.to(roomId).emit('chat:new', sysMsg);

      callback?.({ success: true });
    });

    // 11. Chat Message
    socket.on('chat:send', (payload, callback) => {
      const parse = SendMessageSchema.safeParse(payload);
      if (!parse.success) {
        return callback?.({ success: false, error: parse.error.issues[0]?.message });
      }

      const { roomId, message } = parse.data;
      const chatMsg = roomManager.addChatMessage(roomId, payload.playerId, message);
      if (!chatMsg) {
        return callback?.({ success: false, error: 'Rate limit reached or message invalid.' });
      }

      io.to(roomId).emit('chat:new', chatMsg);
      callback?.({ success: true });
    });

    // 12. Voice Chat Signaling (WebRTC)
    socket.on('voice:join', ({ roomId, playerId }) => {
      roomManager.updateVoiceStatus(roomId, playerId, true, false, false);
      // Notify other voice peers in room
      socket.to(roomId).emit('voice:peer-joined', { playerId });
      broadcastRoomUpdate(roomId);
    });

    socket.on('voice:leave', ({ roomId, playerId }) => {
      roomManager.updateVoiceStatus(roomId, playerId, false, false, false);
      socket.to(roomId).emit('voice:peer-left', { playerId });
      broadcastRoomUpdate(roomId);
    });

    socket.on('voice:signal', (payload: VoiceSignalPayload) => {
      const record = roomManager.getRoom(payload.roomId);
      if (!record) return;

      const target = record.players.find(p => p.id === payload.targetPlayerId);
      if (target && target.socketId) {
        io.to(target.socketId).emit('voice:signal', {
          fromPlayerId: payload.fromPlayerId,
          signal: payload.signal,
        });
      }
    });

    socket.on('voice:speaking', ({ roomId, playerId, isSpeaking, micMuted }) => {
      roomManager.updateVoiceStatus(roomId, playerId, true, micMuted, isSpeaking);
      socket.to(roomId).emit('voice:speaking-state', { playerId, isSpeaking, micMuted });
    });

    // 13. Leave Room
    socket.on('room:leave', ({ roomId, playerId }) => {
      socket.leave(roomId);
      const res = roomManager.leaveRoom(roomId, playerId);
      if (res.room) {
        io.to(roomId).emit('room:update', res.room);
        const sysMsg = roomManager.addSystemMessage(roomId, `A player left the room.`);
        if (sysMsg) io.to(roomId).emit('chat:new', sysMsg);
      }
      io.emit('rooms:public', roomManager.getPublicRooms());
    });

    // 14. Disconnect
    socket.on('disconnect', () => {
      const { roomId, playerId, room, removed } = roomManager.handleDisconnect(socket.id);
      if (roomId && room) {
        io.to(roomId).emit('room:update', room);
        if (removed) {
          const sysMsg = roomManager.addSystemMessage(roomId, 'A player disconnected and left.');
          if (sysMsg) io.to(roomId).emit('chat:new', sysMsg);
        }
      }
      io.emit('rooms:public', roomManager.getPublicRooms());
    });
  });
}
