'use client';

import { useDynamicBridge } from '@/contexts/dynamic-bridge-context';
import { useCallback } from 'react';
import { useDisconnect } from 'wagmi';

/**
 * Disconnects wagmi; when Dynamic is configured, uses SDK logout so wallet + session clear reliably.
 */
export function useWalletDisconnect() {
  const bridge = useDynamicBridge();
  const { disconnectAsync } = useDisconnect();

  return useCallback(async () => {
    if (bridge) {
      await bridge.handleLogOut();
      return;
    }
    await disconnectAsync();
  }, [bridge, disconnectAsync]);
}
