'use client';

import { useChainId } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Loader2 } from 'lucide-react';

import { invoiceRegistryContract } from '@/lib/contract';
import {
  addressExplorerUrl,
  isInvoiceRegistryConfigured,
  tokenExplorerUrl,
  type InvoiceView,
} from '@/lib/pay-invoice';
import { useArcScanTokenInfo } from '@/hooks/use-arcscan-token';
import { cn } from '@/lib/utils';

import { PayInvoiceCopyableText } from '@/components/pay/pay-invoice-copyable-text';
import { PayInvoicePaymentActions } from '@/components/pay/pay-invoice-payment-actions';
import { PayInvoiceWorldIdCard } from '@/components/pay/pay-invoice-world-id-card';

export function PayInvoicePaymentColumn({
  invoice,
}: Readonly<{ invoice: InvoiceView }>) {
  const { t } = useTranslation('common');
  const chainId = useChainId();

  const { data: arcData, loading: arcLoading } = useArcScanTokenInfo(
    invoice.token,
    chainId,
  );
  const tokenName = arcData?.name;

  const tokenUrl = tokenExplorerUrl(chainId, invoice.token);
  const registryUrl = isInvoiceRegistryConfigured()
    ? addressExplorerUrl(chainId, invoiceRegistryContract.address)
    : null;

  const hasArcScanMeta =
    arcData &&
    (arcData.name !== null ||
      arcData.symbol !== null ||
      arcData.decimals !== null);

  return (
    <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
      <PayInvoicePaymentActions invoice={invoice} />

      <PayInvoiceWorldIdCard issuerWorldId={invoice.issuerWorldId} compact />

      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-7">
        <h2 className="text-base font-bold text-heading">
          {t('pay.tokenCardTitle')}
        </h2>

        {arcLoading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {t('pay.tokenArcScanLoading')}
          </div>
        )}

        {!arcLoading && hasArcScanMeta && (
          <p className="mt-3 text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            {t('pay.tokenArcScanData')}
          </p>
        )}

        {!arcLoading && !hasArcScanMeta && (
          <p className="mt-3 text-sm text-muted-foreground">
            {t('pay.tokenFallbackNote')}
          </p>
        )}

        {tokenName ? (
          <p className="mt-2 text-sm font-medium text-foreground">
            {tokenName}
          </p>
        ) : null}

        <div className="mt-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {t('pay.tokenContractAddress')}
          </p>
          <PayInvoiceCopyableText
            value={invoice.token}
            aria-label={t('pay.tokenContractAddress')}
            className="mt-1 text-sm"
          />
        </div>

        {tokenUrl ? (
          <a
            href={tokenUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline',
            )}
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            {t('pay.viewOnArcScan')}
          </a>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">
            {t('pay.arcScanLinkUnavailable')}
          </p>
        )}
      </section>

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
