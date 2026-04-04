'use client';

import { useChainId } from 'wagmi';
import { useTranslation } from 'react-i18next';

import { Separator } from '@/components/ui/separator';
import { chains } from '@/lib/wagmi.config';
import {
  formatInvoiceAmount,
  invoiceStatusI18nKey,
  shortAddress,
  type InvoiceView,
} from '@/lib/pay-invoice';

import { PayInvoiceDetailRow } from '@/components/pay/pay-invoice-detail-row';
import { PayInvoiceStatusBadge } from '@/components/pay/pay-invoice-status-badge';

export function PayInvoiceSummaryCard({
  invoice,
}: Readonly<{ invoice: InvoiceView }>) {
  const { t } = useTranslation('common');
  const chainId = useChainId();
  const chainName =
    chains.find((c) => c.id === chainId)?.name ?? `Chain ${chainId}`;
  const { formatted, symbol } = formatInvoiceAmount(
    invoice.amount,
    invoice.token,
  );
  const sk = invoiceStatusI18nKey(invoice.status);

  return (
    <section
      className="rounded-3xl border border-border/80 bg-card p-6 shadow-md sm:p-10"
      aria-labelledby="pay-invoice-heading"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1
            id="pay-invoice-heading"
            className="text-xl font-bold tracking-tight text-heading sm:text-2xl"
          >
            {t('pay.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('pay.invoiceId')}: {invoice.invoiceId.toString()}
          </p>
        </div>
        <PayInvoiceStatusBadge
          status={invoice.status}
          label={t(`pay.status.${sk}`)}
        />
      </div>

      <div className="mt-8 text-center sm:mt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t('pay.amountDue')}
        </p>
        <p
          className="mt-2 bg-gradient-to-r from-onvo-purple to-onvo-cyan bg-clip-text font-bold text-4xl tabular-nums tracking-tight text-transparent sm:text-5xl"
          aria-live="polite"
        >
          {formatted}
          <span className="ml-2 text-2xl font-semibold text-foreground sm:text-3xl">
            {symbol}
          </span>
        </p>
      </div>

      <Separator className="my-8" />

      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t('pay.summary')}
      </h2>
      <dl className="space-y-4">
        <PayInvoiceDetailRow
          label={t('pay.invoiceHash')}
          value={invoice.invoiceHash}
          mono
        />
        <PayInvoiceDetailRow
          label={t('pay.emitter')}
          value={shortAddress(invoice.emitter, 6)}
          mono
        />
        <PayInvoiceDetailRow
          label={t('pay.recipient')}
          value={shortAddress(invoice.recipient, 6)}
          mono
        />
        <PayInvoiceDetailRow label={t('pay.network')} value={chainName} />
      </dl>
    </section>
  );
}
