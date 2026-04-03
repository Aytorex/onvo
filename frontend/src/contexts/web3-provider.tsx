'use client';

import { createAppKit } from '@reown/appkit/react';
import { hardhat } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BallotDataStoreSync } from '@/contexts/ballot-data-store-sync';
import { networks, projectId, wagmiAdapter } from '@/lib/wagmi.config';
import { type ReactNode } from 'react';
import { cookieToInitialState, WagmiProvider } from 'wagmi';

const queryClient = new QueryClient();

const metadata = {
  name: 'The Ballot Project',
  description: 'The Ballot Project',
  url:
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000',
  icons: [],
};

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [...networks],
  defaultNetwork: hardhat,
  metadata,
  features: {
    analytics: false,
  },
});

export function Web3Provider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig, cookies);

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>
        <BallotDataStoreSync>{children}</BallotDataStoreSync>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
