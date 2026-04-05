'use client';

import { config } from '@/lib/wagmi.config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { type ReactNode, useEffect, useState } from 'react';
import { cookieToInitialState, WagmiProvider } from 'wagmi';

const queryClient = new QueryClient();

const DYNAMIC_ENV_ID = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID ?? '';

const DynamicProviderShell = dynamic(
  () => import('./dynamic-provider-shell').then((m) => m.DynamicProviderShell),
  { ssr: false },
);

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

  const inner =
    mounted && DYNAMIC_ENV_ID ? (
      <DynamicProviderShell>{children}</DynamicProviderShell>
    ) : (
      children
    );

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{inner}</QueryClientProvider>
    </WagmiProvider>
  );
}
