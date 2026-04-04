'use client';

import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function WalletButton() {
  const { t } = useTranslation('common');
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const injected = connectors.find(
    (c) => c.type === 'injected' || c.id === 'injected',
  );

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">
          {shortAddr(address)}
        </span>
        <Button variant="outline" size="sm" onClick={() => disconnect()}>
          {t('wallet.disconnect')}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending || !injected}
      onClick={() => injected && connect({ connector: injected })}
    >
      {isPending ? t('wallet.connecting') : t('wallet.connect')}
    </Button>
  );
}
