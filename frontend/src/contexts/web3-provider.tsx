'use client';

import { config } from '@/lib/wagmi.config';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import {
  DynamicContext,
  DynamicContextProvider,
} from '@dynamic-labs/sdk-react-core';
import { DynamicWagmiConnector } from '@dynamic-labs/wagmi-connector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useContext, useEffect, useState } from 'react';
import { cookieToInitialState, WagmiProvider } from 'wagmi';

const queryClient = new QueryClient();

const DYNAMIC_ENV_ID = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID ?? '';

function SafeDynamicWagmiConnector({
  children,
}: Readonly<{ children: ReactNode }>) {
  const ctx = useContext(DynamicContext);

  if (!ctx?.sdkHasLoaded) {
    return <>{children}</>;
  }

  return <DynamicWagmiConnector>{children}</DynamicWagmiConnector>;
}

export function Web3Provider({
  children,
  cookies,
}: Readonly<{
  children: ReactNode;
  cookies: string | null;
}>) {
  const initialState = cookieToInitialState(config, cookies);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!DYNAMIC_ENV_ID || !mounted) {
    return (
      <WagmiProvider config={config} initialState={initialState}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    );
  }

  return (
    <DynamicContextProvider
      settings={{
        environmentId: DYNAMIC_ENV_ID,
        walletConnectors: [EthereumWalletConnectors],
        overrides: {
          evmNetworks: [
            {
              chainId: '5042002',
              networkId: '5042002',
              name: 'Arc Testnet',
              rpcUrls: ['https://rpc.blockdaemon.testnet.arc.network'],
              nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
              iconUrls: [
                'https://testnet.arcscan.app/assets/configs/network_icon_dark.svg',
              ],
              blockExplorerUrls: ['https://testnet.arcscan.app'],
            },
          ],
        },
      }}
    >
      <WagmiProvider config={config} initialState={initialState}>
        <QueryClientProvider client={queryClient}>
          <SafeDynamicWagmiConnector>{children}</SafeDynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}
