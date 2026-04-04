'use client';

import { AlertTriangle, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { invoiceRegistryContract } from '@/lib/contract';
import {
  addressExplorerUrl,
  isInvoiceRegistryConfigured,
} from '@/lib/pay-invoice';

import { PayInvoiceCopyableText } from '@/components/pay/pay-invoice-copyable-text';

export function PayInvoiceRegistryPanel({
  chainId,
}: Readonly<{
  chainId: number;
}>) {
  const { t } = useTranslation('common');

  const registryUrl = isInvoiceRegistryConfigured()
    ? addressExplorerUrl(chainId, invoiceRegistryContract.address)
    : null;

  if (!registryUrl) {
    return null;
  }

  return (
    <section
      className="rounded-xl border border-border/50 bg-muted/20 p-3 shadow-sm"
      aria-labelledby="pay-registry-heading"
    >
      <h2
        id="pay-registry-heading"
        className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {t('pay.registryContractName')}
      </h2>
      <p className="mt-1 font-mono text-[10px] leading-snug text-muted-foreground">
        {t('pay.registryOnChainCall')}
      </p>
      <div className="mt-2 flex gap-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-2.5 py-2 text-[11px] text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/[0.08] dark:text-amber-100/95">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
        <p className="min-w-0 leading-snug">{t('pay.registryVerifyWarning')}</p>
      </div>
      <a
        href={registryUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1.5 break-words text-xs font-medium text-primary underline-offset-4 hover:underline"
      >
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
        {t('pay.viewRegistryOnArcScan')}
      </a>
      <div className="mt-1.5">
        <PayInvoiceCopyableText
          value={invoiceRegistryContract.address}
          aria-label={t('pay.registryContractLabel')}
          className="text-xs text-muted-foreground"
        />
      </div>
    </section>
  );
}
