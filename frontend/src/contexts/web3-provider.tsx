'use client';

import { BallotDataStoreSync } from '@/contexts/ballot-data-store-sync';
import { config } from '@/lib/wagmi.config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { cookieToInitialState, WagmiProvider } from 'wagmi';

const queryClient = new QueryClient();

export function Web3Provider({
  children,
  cookies,
}: Readonly<{
  children: ReactNode;
  cookies: string | null;
}>) {
  const initialState = cookieToInitialState(config, cookies);

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <BallotDataStoreSync>{children}</BallotDataStoreSync>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
