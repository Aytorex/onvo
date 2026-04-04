'use client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LogOut, Wallet } from 'lucide-react';
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
      <span
        className="inline-flex h-9 max-w-[min(100%,14rem)] items-center gap-2 rounded-full border border-border bg-muted/70 py-0 pl-3 pr-1 text-xs font-medium tabular-nums text-foreground backdrop-blur-sm sm:max-w-none"
        title={address}
      >
        <Wallet
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate font-mono sm:max-w-[11rem]">
          {shortAddr(address)}
        </span>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:bg-background/80 hover:text-foreground"
                aria-label={t('wallet.disconnect')}
                onClick={() => disconnect()}
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end">
              {t('wallet.disconnect')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </span>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      className="gap-1.5"
      disabled={isPending || !injected}
      onClick={() => injected && connect({ connector: injected })}
    >
      <Wallet className="h-3.5 w-3.5 opacity-80" aria-hidden />
      {isPending ? t('wallet.connecting') : t('wallet.connect')}
    </Button>
  );
}
