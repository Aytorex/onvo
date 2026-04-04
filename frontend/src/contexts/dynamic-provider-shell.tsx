'use client';

import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import {
  DynamicContext,
  DynamicContextProvider,
} from '@dynamic-labs/sdk-react-core';
import { DynamicWagmiConnector } from '@dynamic-labs/wagmi-connector';
import { type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import {
  DynamicBridgeContext,
  type DynamicBridge,
} from './dynamic-bridge-context';

const DYNAMIC_ENV_ID = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID ?? '';

function BridgeProvider({ children }: Readonly<{ children: ReactNode }>) {
  const ctx = useContext(DynamicContext);

  const bridge = useMemo<DynamicBridge | null>(() => {
    if (!ctx?.sdkHasLoaded) return null;
    return {
      sdkHasLoaded: true,
      setShowAuthFlow: (show: boolean) => ctx.setShowAuthFlow(show),
      handleLogOut: () => ctx.handleLogOut(),
    };
  }, [ctx?.sdkHasLoaded, ctx]);

  return (
    <DynamicBridgeContext.Provider value={bridge}>
      {children}
    </DynamicBridgeContext.Provider>
  );
}

function SafeDynamicWagmiConnector({
  children,
}: Readonly<{ children: ReactNode }>) {
  const ctx = useContext(DynamicContext);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ctx?.sdkHasLoaded) {
      setReady(true);
    }
  }, [ctx?.sdkHasLoaded]);

  if (!ready) {
    return <>{children}</>;
  }

  return <DynamicWagmiConnector>{children}</DynamicWagmiConnector>;
}

export function DynamicProviderShell({
  children,
}: Readonly<{ children: ReactNode }>) {
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
      <BridgeProvider>
        <SafeDynamicWagmiConnector>{children}</SafeDynamicWagmiConnector>
      </BridgeProvider>
    </DynamicContextProvider>
  );
}
