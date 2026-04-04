'use client';

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChainId } from 'wagmi';
import { ExternalLink, Loader2, Usb, Wallet } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  explorerTxUrl,
  generateMockTxHash,
  INVOICE_STATUS,
  type InvoiceView,
} from '@/lib/pay-invoice';

import { PayInvoiceCopyHashButton } from '@/components/pay/pay-invoice-copy-hash-button';

type PayChannel = 'ledger' | 'other';
type Phase = 'idle' | 'simulating' | 'success';

export function PayInvoicePaymentActions({
  invoice,
}: Readonly<{ invoice: InvoiceView }>) {
  const { t } = useTranslation('common');
  const chainId = useChainId();
  const [phase, setPhase] = useState<Phase>('idle');
  const [channel, setChannel] = useState<PayChannel | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const runMockPayment = useCallback(async (nextChannel: PayChannel) => {
    setChannel(nextChannel);
    setPhase('simulating');
    setTxHash(null);
    await new Promise((r) => setTimeout(r, 1600));
    setTxHash(generateMockTxHash());
    setPhase('success');
  }, []);

  if (invoice.status !== INVOICE_STATUS.Pending) {
    return null;
  }

  const explorerLink = txHash ? explorerTxUrl(txHash, chainId) : null;

  if (phase === 'success' && txHash) {
    return (
      <div className="space-y-5">
        <Alert className="border-border bg-muted/40">
          <AlertTitle>{t('pay.mockSuccessTitle')}</AlertTitle>
          <AlertDescription>{t('pay.mockSuccessBody')}</AlertDescription>
        </Alert>
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('pay.mockTxHash')}
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

  const simulatingLedger = phase === 'simulating' && channel === 'ledger';
  const simulatingOther = phase === 'simulating' && channel === 'other';

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 p-6 shadow-lg shadow-primary/5 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-onvo-purple/15 to-onvo-cyan/10 blur-3xl" />
      <div className="relative space-y-4">
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
              size="lg"
              disabled={phase === 'simulating'}
              className="h-14 w-full rounded-xl bg-[#000000] text-base font-semibold text-white shadow-md transition hover:bg-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
              onClick={() => void runMockPayment('ledger')}
            >
              {simulatingLedger ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('pay.payingLedger')}
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
            disabled={phase === 'simulating'}
            className="h-12 w-full rounded-xl border-2 border-heading bg-background/80 text-base font-medium text-foreground hover:bg-muted/60"
            onClick={() => void runMockPayment('other')}
          >
            {simulatingOther ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('pay.payingOther')}
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4 shrink-0" />
                {t('pay.payOther')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
