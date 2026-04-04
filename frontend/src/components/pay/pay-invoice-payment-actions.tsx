'use client';

import { ExternalLink, Loader2, Usb, Wallet } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAccount, useChainId } from 'wagmi';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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

/** Distinguishes which CTA was used (same wagmi path; Ledger is typically via Rabby + device). */
type PayUiChannel = 'ledger' | 'other';

type BusyState = { channel: PayUiChannel; step: WalletPaymentStep };

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
  const { isConnected } = useAccount();
  const { payWithInjectedWallet } = useInvoicePayment();

  const [busy, setBusy] = useState<BusyState | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const payOnChain = useCallback(
    async (channel: PayUiChannel) => {
      setErrorMessage(null);
      if (!isConnected) {
        toast.error(t('pay.connectWalletFirst'));
        return;
      }
      try {
        const hash = await payWithInjectedWallet(invoice, (step) => {
          setBusy({ channel, step });
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
    },
    [isConnected, invoice, onPaymentConfirmed, payWithInjectedWallet, t],
  );

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

  const simulatingLedger = busy?.channel === 'ledger';
  const simulatingOther = busy?.channel === 'other';

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 p-6 shadow-lg shadow-primary/5 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-onvo-purple/15 to-onvo-cyan/10 blur-3xl" />
      <div className="relative space-y-4">
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>{t('pay.paymentErrorTitle')}</AlertTitle>
            <AlertDescription className="break-words">
              {errorMessage}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-1.5 text-center">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('pay.payPathIntro')}
          </p>
          <p className="text-sm font-semibold text-heading">
            {t('pay.choosePayment')}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Badge className="absolute -right-1 -top-2 z-10 border border-emerald-600/30 bg-emerald-600 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
              {t('pay.payLedgerRecommended')}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={!!busy}
              className={cn(
                'h-14 w-full rounded-xl border-0 bg-[#000000] text-base font-semibold text-white shadow-md',
                'hover:bg-neutral-900 hover:text-white',
                'focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2',
              )}
              onClick={() => void payOnChain('ledger')}
            >
              {simulatingLedger ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {loadingLabel}
                </>
              ) : (
                <>
                  <Usb className="mr-2 h-5 w-5 shrink-0" />
                  {t('pay.payWithLedger')}
                </>
              )}
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={!!busy}
            className={cn(
              'h-14 w-full rounded-xl border border-neutral-300 bg-neutral-100 text-base font-semibold text-neutral-950',
              'hover:bg-neutral-200 hover:text-neutral-950',
              'dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-700',
              'focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2',
            )}
            onClick={() => void payOnChain('other')}
          >
            {simulatingOther ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {loadingLabel}
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-5 w-5 shrink-0" />
                {t('pay.payOther')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
