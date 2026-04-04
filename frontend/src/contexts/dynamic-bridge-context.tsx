'use client';

import { createContext, useContext } from 'react';

export type DynamicBridge = {
  sdkHasLoaded: boolean;
  setShowAuthFlow: (show: boolean) => void;
  handleLogOut: () => Promise<void>;
};

export const DynamicBridgeContext = createContext<DynamicBridge | null>(null);

export function useDynamicBridge(): DynamicBridge | null {
  return useContext(DynamicBridgeContext);
}
