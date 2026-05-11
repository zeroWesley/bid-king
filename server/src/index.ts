import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from './types';
import {
  createRoom, addPlayer, setPlayerReady, canStartGame,
  startGame, startRound, advancePhase, placeBid, settleRound,
  getGameResult, useSkill, toPublicRoom, toPublicRound,
} from './gameEngine';
import { GameRoom } from './types';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
  },
});

// In-memory room store (use Redis in production)
const rooms = new Map<string, GameRoom>(); // roomCode -> room
const socketToRoom = new Map<string, string>(); // socketId -> roomCode
const socketToPlayer = new Map<string, string>(); // socketId -> playerId

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

io.on('connection', (socket) => {
  console.log(`[+] Socket connected: ${socket.id}`);

  socket.on('create_room', (payload, callback) => {
    const playerId = socket.id;
    const room = createRoom(playerId, payload.playerName, payload.role);
    rooms.set(room.code, room);
    socketToRoom.set(socket.id, room.code);
    socketToPlayer.set(socket.id, playerId);
    socket.join(room.code);
    console.log(`[Room] Created: ${room.code} by ${payload.playerName}`);
    callback(room.code);
    io.to(room.code).emit('room_updated', toPublicRoom(room));
  });

  socket.on('join_room', (payload, callback) => {
    const room = rooms.get(payload.roomCode.toUpperCase());
    if (!room) {
      callback(false, '房间不存在');
      return;
    }
    if (room.players.length >= 4) {
      callback(false, '房间已满');
      return;
    }
    if (room.gamePhase !== 'waiting') {
      callback(false, '游戏已开始');
      return;
    }

    const playerId = socket.id;
    const success = addPlayer(room, playerId, payload.playerName, payload.role);
    if (!success) {
      callback(false, '加入失败');
      return;
    }

    socketToRoom.set(socket.id, room.code);
    socketToPlayer.set(socket.id, playerId);
    socket.join(room.code);
    console.log(`[Room] ${payload.playerName} joined ${room.code}`);
    callback(true);
    io.to(room.code).emit('room_updated', toPublicRoom(room));
  });

  socket.on('player_ready', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    setPlayerReady(room, socket.id);
    io.to(roomCode).emit('room_updated', toPublicRoom(room));
  });

  socket.on('start_game', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    if (!canStartGame(room, socket.id)) {
      socket.emit('error', '无法开始游戏：需要所有玩家准备且至少2人');
      return;
    }

    startGame(room);
    io.to(roomCode).emit('room_updated', toPublicRoom(room));

    // Broadcast round start to each player individually (personalized view)
    broadcastRoundStart(room, roomCode);

    // Schedule phase transitions
    schedulePhaseTransition(room, roomCode);
  });

  socket.on('place_bid', (payload) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    const success = placeBid(room, socket.id, payload.amount);
    if (!success) {
      socket.emit('error', '出价失败：金额不足或不符合规则');
      return;
    }

    const bidCount = Object.keys(room.roundState!.bids).length;
    io.to(roomCode).emit('bid_placed', {
      highestBid: room.roundState!.highestBid,
      bidCount,
    });
  });

  socket.on('use_skill', (payload, callback) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    const result = useSkill(room, socket.id, payload.targetArtifactId);
    callback(result);
  });

  socket.on('send_chat', (message) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    io.to(roomCode).emit('chat_message', {
      playerName: player.name,
      message: message.substring(0, 200),
      timestamp: Date.now(),
    });
  });

  socket.on('disconnect', () => {
    console.log(`[-] Socket disconnected: ${socket.id}`);
    const roomCode = socketToRoom.get(socket.id);
    if (roomCode) {
      const room = rooms.get(roomCode);
      if (room) {
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
          player.isConnected = false;
          io.to(roomCode).emit('player_left', socket.id);
          io.to(roomCode).emit('room_updated', toPublicRoom(room));
        }
      }
      socketToRoom.delete(socket.id);
      socketToPlayer.delete(socket.id);
    }
  });
});

function broadcastRoundStart(room: GameRoom, roomCode: string): void {
  if (!room.roundState) return;
  for (const player of room.players) {
    const playerSocket = io.sockets.sockets.get(player.socketId);
    if (playerSocket) {
      playerSocket.emit('round_started', toPublicRound(room.roundState, player.id));
    }
  }
}

function schedulePhaseTransition(room: GameRoom, roomCode: string): void {
  if (!room.roundState) return;

  const duration = room.roundState.phaseEndTime - Date.now();
  setTimeout(() => {
    const currentRoom = rooms.get(roomCode);
    if (!currentRoom || !currentRoom.roundState) return;

    const nextPhase = advancePhase(currentRoom);

    if (nextPhase === 'settlement') {
      // Settle the round
      const settlement = settleRound(currentRoom);
      io.to(roomCode).emit('round_settled', settlement);
      io.to(roomCode).emit('room_updated', toPublicRoom(currentRoom));

      if (currentRoom.gamePhase === 'finished') {
        const result = getGameResult(currentRoom);
        io.to(roomCode).emit('game_finished', result);
      } else {
        // Start next round after 5 seconds
        setTimeout(() => {
          startRound(currentRoom);
          broadcastRoundStart(currentRoom, roomCode);
          schedulePhaseTransition(currentRoom, roomCode);
        }, 5000);
      }
    } else {
      io.to(roomCode).emit('phase_changed', {
        phase: nextPhase,
        endTime: currentRoom.roundState!.phaseEndTime,
        highestBid: currentRoom.roundState!.highestBid,
      });
      broadcastRoundStart(currentRoom, roomCode);
      schedulePhaseTransition(currentRoom, roomCode);
    }
  }, Math.max(duration, 1000));
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 BidKing server running on port ${PORT}`);
});
