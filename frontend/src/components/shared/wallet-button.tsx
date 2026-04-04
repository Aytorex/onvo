'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { EurcIcon, UsdcIcon } from '@/components/shared/stablecoin-icons';
import { arcTestnet } from '@/lib/arc-chain';
import { getTokenAddress, tokenDecimals } from '@/lib/invoice-tokens';
import { LogOut, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { erc20Abi, formatUnits } from 'viem';
import { useAccount, useConnect, useDisconnect, useReadContract } from 'wagmi';

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function formatTokenDisplay(
  raw: bigint,
  decimals: number,
  locale: string,
): string {
  const s = formatUnits(raw, decimals);
  const n = Number(s);
  if (!Number.isFinite(n)) {
    return s;
  }
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(n);
}

function balanceSegment(
  loading: boolean,
  error: boolean,
  raw: bigint | undefined,
  decimals: number,
  locale: string,
  t: (key: string) => string,
): string {
  if (loading) {
    return t('wallet.tokenBalanceLoading');
  }
  if (error || raw === undefined) {
    return t('wallet.tokenBalanceUnavailable');
  }
  return formatTokenDisplay(raw, decimals, locale);
}

export function WalletButton() {
  const { t, i18n } = useTranslation('common');
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const usdcAddress = getTokenAddress('USDC');
  const eurcAddress = getTokenAddress('EURC');
  const decimals = tokenDecimals();

  const usdcRead = useReadContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: arcTestnet.id,
    query: {
      enabled: Boolean(isConnected && address),
      refetchInterval: 20_000,
    },
  });

  const eurcRead = useReadContract({
    address: eurcAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: arcTestnet.id,
    query: {
      enabled: Boolean(isConnected && address),
      refetchInterval: 20_000,
    },
  });

  const injected = connectors.find(
    (c) => c.type === 'injected' || c.id === 'injected',
  );

  if (isConnected && address) {
    const usdcSeg = balanceSegment(
      usdcRead.isLoading,
      usdcRead.isError,
      usdcRead.data,
      decimals,
      i18n.language,
      t,
    );
    const eurcSeg = balanceSegment(
      eurcRead.isLoading,
      eurcRead.isError,
      eurcRead.data,
      decimals,
      i18n.language,
      t,
    );

    const usdcTitle =
      usdcRead.isLoading || usdcRead.isError || usdcRead.data === undefined
        ? usdcSeg
        : `${formatUnits(usdcRead.data, decimals)} USDC`;
    const eurcTitle =
      eurcRead.isLoading || eurcRead.isError || eurcRead.data === undefined
        ? eurcSeg
        : `${formatUnits(eurcRead.data, decimals)} EURC`;
    const title = `${address}\n${usdcTitle}\n${eurcTitle}`;

    const ariaUsdc =
      usdcRead.data !== undefined && !usdcRead.isError && !usdcRead.isLoading
        ? `USDC ${formatUnits(usdcRead.data, decimals)}`
        : `USDC ${usdcSeg}`;
    const ariaEurc =
      eurcRead.data !== undefined && !eurcRead.isError && !eurcRead.isLoading
        ? `EURC ${formatUnits(eurcRead.data, decimals)}`
        : `EURC ${eurcSeg}`;

    return (
      <TooltipProvider delayDuration={200}>
        <span
          className="inline-flex min-h-9 max-w-[min(100%,22rem)] items-center gap-1.5 rounded-full border border-border bg-muted/70 py-0 pl-2.5 pr-1 text-xs font-medium tabular-nums text-foreground backdrop-blur-sm sm:max-w-none sm:gap-2 sm:pl-3"
          title={title}
          role="group"
          aria-label={`${address}, ${ariaUsdc}, ${ariaEurc}, ${t('wallet.stableBalancesOnArc')}`}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex min-w-0 cursor-default items-center gap-1.5 sm:gap-2">
                <span className="inline-flex min-w-0 items-center gap-1">
                  <UsdcIcon className="h-4 w-4" />
                  <span className="text-sm font-semibold tracking-tight">
                    {usdcSeg}
                  </span>
                </span>
                <Separator
                  orientation="vertical"
                  decorative
                  className="h-4 w-px shrink-0"
                />
                <span className="inline-flex min-w-0 items-center gap-1">
                  <EurcIcon className="h-4 w-4" />
                  <span className="text-sm font-semibold tracking-tight">
                    {eurcSeg}
                  </span>
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start">
              {t('wallet.stableBalancesOnArc')}
            </TooltipContent>
          </Tooltip>
          <Separator
            orientation="vertical"
            decorative
            className="h-4 w-px shrink-0"
          />
          <Wallet
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="min-w-0 max-w-[4.5rem] truncate font-mono text-[11px] text-muted-foreground sm:max-w-[11rem] sm:text-xs">
            {shortAddr(address)}
          </span>
          <Separator
            orientation="vertical"
            decorative
            className="h-4 w-px shrink-0"
          />
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
        </span>
      </TooltipProvider>
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
