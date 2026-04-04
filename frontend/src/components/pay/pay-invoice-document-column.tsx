'use client';

import { useChainId } from 'wagmi';
import { useTranslation } from 'react-i18next';

import { chains } from '@/lib/wagmi.config';
import {
  formatInvoiceAmount,
  invoiceStatusI18nKey,
  shortAddress,
  type InvoiceView,
} from '@/lib/pay-invoice';

import { PayInvoiceCopyHashButton } from '@/components/pay/pay-invoice-copy-hash-button';
import { PayInvoiceLegalCard } from '@/components/pay/pay-invoice-legal-card';
import { PayInvoiceStatusBadge } from '@/components/pay/pay-invoice-status-badge';
import { PayInvoiceWorldIdCard } from '@/components/pay/pay-invoice-world-id-card';

export function PayInvoiceDocumentColumn({
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
    <div className="space-y-6">
      <section
        className="rounded-3xl border border-border/80 bg-card p-6 shadow-md sm:p-8"
        aria-labelledby="pay-invoice-heading"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h1
              id="pay-invoice-heading"
              className="text-xl font-bold tracking-tight text-heading sm:text-2xl"
            >
              {t('pay.title')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('pay.invoiceId')}:{' '}
              <span className="font-medium text-foreground">
                {invoice.invoiceId.toString()}
              </span>
            </p>
          </div>
          <PayInvoiceStatusBadge
            status={invoice.status}
            label={t(`pay.status.${sk}`)}
          />
        </div>

        <div className="mt-8 rounded-2xl border border-border/60 bg-muted/30 p-6 sm:mt-10">
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
      </section>

      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('pay.partiesTitle')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('pay.emitter')}
            </p>
            <p className="mt-2 font-mono text-sm text-foreground">
              {shortAddress(invoice.emitter, 8)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('pay.recipient')}
            </p>
            <p className="mt-2 font-mono text-sm text-foreground">
              {shortAddress(invoice.recipient, 8)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4 sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('pay.network')}
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {chainName}
            </p>
          </div>
        </div>
      </section>

      <PayInvoiceWorldIdCard issuerWorldId={invoice.issuerWorldId} />

      <PayInvoiceLegalCard invoice={invoice} embedded />

      <section
        className="rounded-3xl border border-dashed border-border/70 bg-muted/10 p-6 sm:p-8"
        aria-labelledby="pay-verify-authenticity"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <h2
            id="pay-verify-authenticity"
            className="text-base font-semibold text-heading"
          >
            {t('pay.verifyAuthenticityTitle')}
          </h2>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('pay.verifyAuthenticityOptional')}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t('pay.verifyAuthenticityIntro')}
        </p>
        <div className="mt-4 rounded-xl border border-border/60 bg-card/80 p-4 dark:bg-card/50">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('pay.invoiceHash')}
          </p>
          <code className="mt-2 block break-all font-mono text-xs leading-relaxed text-foreground sm:text-sm">
            {invoice.invoiceHash}
          </code>
          <div className="mt-3 flex flex-wrap gap-2">
            <PayInvoiceCopyHashButton hash={invoice.invoiceHash} />
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {t('pay.pdfCompareHint')}
        </p>
      </section>
    </div>
  );
}
