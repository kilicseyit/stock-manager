import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

/** Socket.io event tipleri */
export interface ServerToClientEvents {
  'inventory:update': (data: {
    productId: string;
    locationId: string;
    quantity: number;
    type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
    productName?: string;
  }) => void;
  'notification:push': (data: {
    userId: string;
    title: string;
    body: string;
    type: string;
  }) => void;
}

export interface ClientToServerEvents {
  'join:inventory': () => void;
  'leave:inventory': () => void;
}

// Global singleton — Next.js dev modunda hot-reload'dan koruyor
const globalForSocket = globalThis as unknown as {
  socketIO: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | undefined;
};

/**
 * Socket.io server instance'ı al veya oluştur.
 * Next.js custom server entegrasyonu için kullanılır.
 */
export function getSocketIO(
  httpServer?: HTTPServer
): SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null {
  if (globalForSocket.socketIO) {
    return globalForSocket.socketIO;
  }

  if (!httpServer) {
    return null;
  }

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on('join:inventory', () => {
      socket.join('inventory');
    });

    socket.on('leave:inventory', () => {
      socket.leave('inventory');
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  globalForSocket.socketIO = io;
  return io;
}

/**
 * Inventory güncellemesini broadcast et.
 * Socket.io bağlı değilse sessizce skip eder.
 */
export function broadcastInventoryUpdate(data: {
  productId: string;
  locationId: string;
  quantity: number;
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  productName?: string;
}) {
  const io = globalForSocket.socketIO;
  if (io) {
    io.to('inventory').emit('inventory:update', data);
  }
}

/**
 * Bildirim push et (belirli kullanıcıya).
 */
export function pushNotification(data: {
  userId: string;
  title: string;
  body: string;
  type: string;
}) {
  const io = globalForSocket.socketIO;
  if (io) {
    io.emit('notification:push', data);
  }
}
