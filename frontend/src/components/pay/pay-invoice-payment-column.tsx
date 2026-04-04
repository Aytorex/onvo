'use client';

import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { invoiceRegistryContract } from '@/lib/contract';
import {
  addressExplorerUrl,
  isInvoiceRegistryConfigured,
  type InvoiceView,
} from '@/lib/pay-invoice';

import { PayInvoiceCopyableText } from '@/components/pay/pay-invoice-copyable-text';
import { PayInvoicePaymentActions } from '@/components/pay/pay-invoice-payment-actions';
import { PayInvoiceWorldIdCard } from '@/components/pay/pay-invoice-world-id-card';
import { WalletButton } from '@/components/shared/wallet-button';
import { cn } from '@/lib/utils';

export function PayInvoicePaymentColumn({
  invoice,
  chainId,
  onPaymentConfirmed,
}: Readonly<{
  invoice: InvoiceView;
  chainId: number;
  onPaymentConfirmed: () => void;
}>) {
  const { t } = useTranslation('common');

  const registryUrl = isInvoiceRegistryConfigured()
    ? addressExplorerUrl(chainId, invoiceRegistryContract.address)
    : null;

  return (
    <aside className="flex h-full min-h-0 flex-col gap-5">
      <div
        className={cn(
          'flex w-full flex-col gap-5',
          'lg:sticky lg:top-24 lg:z-10',
        )}
      >
        <div className="flex justify-end">
          <WalletButton />
        </div>
        <PayInvoicePaymentActions
          invoice={invoice}
          onPaymentConfirmed={onPaymentConfirmed}
        />

        <PayInvoiceWorldIdCard issuerWorldId={invoice.issuerWorldId} compact />
      </div>

      {registryUrl ? (
        <section className="rounded-3xl border border-border/80 bg-muted/20 p-6 sm:p-7">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('pay.registryContractLabel')}
          </p>
          <a
            href={registryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 break-all text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            {t('pay.viewRegistryOnArcScan')}
          </a>
          <div className="mt-2">
            <PayInvoiceCopyableText
              value={invoiceRegistryContract.address}
              aria-label={t('pay.registryContractLabel')}
              className="text-xs text-muted-foreground"
            />
          </div>
        </section>
      ) : null}
    </aside>
  );
}
