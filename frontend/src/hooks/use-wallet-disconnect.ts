'use client';

import { DynamicContext } from '@dynamic-labs/sdk-react-core';
import { useCallback, useContext } from 'react';
import { useDisconnect } from 'wagmi';

/**
 * Disconnects wagmi; when Dynamic is configured, uses SDK logout so wallet + session clear reliably.
 */
export function useWalletDisconnect() {
  const dynamicCtx = useContext(DynamicContext);
  const { disconnectAsync } = useDisconnect();

  return useCallback(async () => {
    if (dynamicCtx) {
      await dynamicCtx.handleLogOut();
      return;
    }
    await disconnectAsync();
  }, [dynamicCtx, disconnectAsync]);
}
