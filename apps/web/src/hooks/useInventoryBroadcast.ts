'use client';

import { useEffect, useRef, useCallback } from 'react';

type InventoryUpdatePayload = {
  productId?: string;
  locationId?: string;
  type?: string;
  timestamp: number;
};

/**
 * BroadcastChannel tabanlı gerçek zamanlı stok güncelleme hook'u.
 *
 * Socket.io yerine BroadcastChannel API kullanır:
 * - Aynı origin'deki tüm sekme/pencereler arası iletişim sağlar
 * - Server tarafında ekstra kurulum gerektirmez
 * - Next.js App Router ile %100 uyumlu
 *
 * Kullanım:
 *   const { broadcastInventoryUpdate, onInventoryUpdate } = useInventoryBroadcast();
 */
export function useInventoryBroadcast() {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const channel = new BroadcastChannel('inventory-updates');
    channelRef.current = channel;

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  /** Diğer sekmelere stok güncellemesi bildir */
  const broadcastUpdate = useCallback((payload?: Omit<InventoryUpdatePayload, 'timestamp'>) => {
    channelRef.current?.postMessage({ ...payload, timestamp: Date.now() });
  }, []);

  /** Başka sekmelerden gelen stok güncellemelerini dinle */
  const onInventoryUpdate = useCallback(
    (handler: (data: InventoryUpdatePayload) => void) => {
      const channel = channelRef.current;
      if (!channel) return () => {};

      const listener = (event: MessageEvent<InventoryUpdatePayload>) => {
        handler(event.data);
      };

      channel.addEventListener('message', listener);
      return () => {
        channel.removeEventListener('message', listener);
      };
    },
    []
  );

  return { broadcastUpdate, onInventoryUpdate };
}
