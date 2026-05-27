'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

/** Socket.io server event tipleri (client tarafında) */
interface ServerToClientEvents {
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

interface ClientToServerEvents {
  'join:inventory': () => void;
  'leave:inventory': () => void;
}

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Socket.io client hook.
 * Otomatik bağlantı/bağlantı kesme lifecycle yönetimi.
 */
export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null);

  useEffect(() => {
    const socket: TypedSocket = io({
      path: '/api/socketio',
      addTrailingSlash: false,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket.io] Connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('[Socket.io] Disconnected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  /** Inventory odasına katıl */
  const joinInventory = useCallback(() => {
    socketRef.current?.emit('join:inventory');
  }, []);

  /** Inventory odasından ayrıl */
  const leaveInventory = useCallback(() => {
    socketRef.current?.emit('leave:inventory');
  }, []);

  /** Inventory güncelleme event'i dinle */
  const onInventoryUpdate = useCallback(
    (handler: ServerToClientEvents['inventory:update']) => {
      const socket = socketRef.current;
      if (!socket) return () => {};

      socket.on('inventory:update', handler);
      return () => {
        socket.off('inventory:update', handler);
      };
    },
    []
  );

  /** Bildirim event'i dinle */
  const onNotification = useCallback(
    (handler: ServerToClientEvents['notification:push']) => {
      const socket = socketRef.current;
      if (!socket) return () => {};

      socket.on('notification:push', handler);
      return () => {
        socket.off('notification:push', handler);
      };
    },
    []
  );

  return {
    socket: socketRef,
    joinInventory,
    leaveInventory,
    onInventoryUpdate,
    onNotification,
  };
}
