'use client';

import { DynamicConnectButton } from '@/components/shared/dynamic-connect-button';
import { ExternalLink, Loader2, LogOut, Wallet } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useWalletDisconnect } from '@/hooks/use-wallet-disconnect';
import { useAccount, useChainId } from 'wagmi';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  useInvoicePayment,
  type WalletPaymentStep,
} from '@/hooks/use-invoice-payment';
import {
  explorerTxUrl,
  INVOICE_STATUS,
  type InvoiceView,
} from '@/lib/pay-invoice';
import { cn } from '@/lib/utils';

import { PayInvoiceCopyHashButton } from '@/components/pay/pay-invoice-copy-hash-button';

function shortPayAddr(a: string) {
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

type BusyState = { step: WalletPaymentStep };

function busyLabel(busy: BusyState, t: (key: string) => string): string {
  if (busy.step === 'approving') return t('pay.walletApproving');
  if (busy.step === 'paying') return t('pay.walletPaying');
  return t('pay.paying');
}

export function PayInvoicePaymentActions({
  invoice,
  onPaymentConfirmed,
}: Readonly<{
  invoice: InvoiceView;
  onPaymentConfirmed: () => void;
}>) {
  const { t } = useTranslation('common');
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const disconnectWallet = useWalletDisconnect();
  const { payWithInjectedWallet } = useInvoicePayment();

  const [busy, setBusy] = useState<BusyState | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const payOnChain = useCallback(async () => {
    setErrorMessage(null);
    if (!isConnected || !address) {
      toast.error(t('pay.connectWalletFirst'));
      return;
    }
    try {
      const hash = await payWithInjectedWallet(invoice, (step) => {
        setBusy({ step });
      });
      setTxHash(hash);
      setBusy(null);
      onPaymentConfirmed();
      toast.success(t('pay.paySuccessToast'));
    } catch (e) {
      setBusy(null);
      const msg =
        e instanceof Error ? e.message : t('pay.paymentFailedGeneric');
      setErrorMessage(msg);
      toast.error(msg);
    }
  }, [
    address,
    isConnected,
    invoice,
    onPaymentConfirmed,
    payWithInjectedWallet,
    t,
  ]);

  const loadingLabel = busy ? busyLabel(busy, t) : null;

  if (invoice.status !== INVOICE_STATUS.Pending) {
    return null;
  }

  const explorerLink = txHash ? explorerTxUrl(txHash, chainId) : null;

  if (txHash && !busy) {
    return (
      <div className="space-y-5">
        <Alert className="border-border bg-muted/40">
          <AlertTitle>{t('pay.paySuccessTitle')}</AlertTitle>
          <AlertDescription>{t('pay.paySuccessBody')}</AlertDescription>
        </Alert>
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('pay.onChainTxHash')}
          </p>
          <code className="mt-2 block break-all font-mono text-sm leading-relaxed text-foreground">
            {txHash}
          </code>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <PayInvoiceCopyHashButton hash={txHash} />
            {explorerLink ? (
              <a
                href={explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'inline-flex rounded-xl',
                )}
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                {t('pay.viewOnExplorer')}
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t('pay.explorerUnavailable')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const cardShell = (inner: ReactNode) => (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/30 p-5 shadow-md shadow-primary/5 sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-onvo-purple/15 to-onvo-cyan/10 blur-3xl" />
      <div className="relative space-y-4">{inner}</div>
    </div>
  );

  if (!isConnected || !address) {
    return cardShell(
      <>
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>{t('pay.paymentErrorTitle')}</AlertTitle>
            <AlertDescription className="break-words">
              {errorMessage}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold text-heading">
            {t('pay.connectPromptTitle')}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('pay.connectPromptBody')}
          </p>
        </div>

        <DynamicConnectButton
          size="lg"
          fullWidth
          connectLabel={t('pay.connectWithDynamic')}
          className="h-14 rounded-full text-base shadow-lg shadow-[#4779FF]/35 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          {t('pay.payPathIntro')}
        </p>
      </>,
    );
  }

  return cardShell(
    <>
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>{t('pay.paymentErrorTitle')}</AlertTitle>
          <AlertDescription className="break-words">
            {errorMessage}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/25 px-3 py-2.5">
        <span
          className="min-w-0 truncate font-mono text-xs text-muted-foreground"
          title={address}
        >
          {shortPayAddr(address)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => void disconnectWallet()}
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden />
          {t('wallet.disconnect')}
        </Button>
      </div>

      <div className="space-y-1.5 text-center">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t('pay.payPathIntro')}
        </p>
        <p className="text-sm font-semibold text-heading">
          {t('pay.choosePayment')}
        </p>
      </div>

      <Button
        type="button"
        variant="default"
        size="lg"
        disabled={!!busy}
        className={cn(
          'h-14 w-full rounded-full border-0 text-base font-semibold text-white shadow-md',
          'bg-gradient-to-r from-onvo-purple to-onvo-cyan',
          'hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:opacity-60',
        )}
        onClick={() => void payOnChain()}
      >
        {busy ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
            {loadingLabel}
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-5 w-5 shrink-0" aria-hidden />
            {t('pay.payNow')}
          </>
        )}
      </Button>
    </>,
  );
}
