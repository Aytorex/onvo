'use client';

import type { ReactNode } from 'react';

import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';

const appId = process.env.NEXT_PUBLIC_WORLD_MINI_APP_ID;

export function PayMiniKitProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <MiniKitProvider props={appId ? { appId } : undefined}>
      {children}
    </MiniKitProvider>
  );
}
