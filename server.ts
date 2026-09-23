/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { RoomManager } from './server/rooms/RoomManager.js';
import { setupSocket } from './server/socket/setupSocket.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with CORS support
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 25000,
});

app.use(express.json());

const roomManager = new RoomManager();
setupSocket(io, roomManager);

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    app: 'classUNO',
  });
});

app.get('/api/rooms/public', (req, res) => {
  res.json({
    rooms: roomManager.getPublicRooms(),
  });
});

app.get('/api/rooms/:code/check', (req, res) => {
  const code = req.params.code;
  const record = roomManager.getRoomByCode(code);
  if (!record) {
    return res.status(404).json({ exists: false, message: 'Room not found.' });
  }

  return res.json({
    exists: true,
    name: record.name,
    code: record.code,
    playerCount: record.players.length,
    maxPlayers: record.maxPlayers,
    hasPassword: record.hasPassword,
    status: record.engine ? record.engine.status : 'LOBBY',
    isFull: record.players.length >= record.maxPlayers,
  });
});

// Dev vs Prod Vite Integration
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[classUNO] Server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch(err => {
  console.error('[classUNO] Startup error:', err);
  process.exit(1);
});
