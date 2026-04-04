'use client';

import { useTranslation } from 'react-i18next';

import {
  formatInvoiceAmount,
  invoiceStatusI18nKey,
  type InvoiceView,
} from '@/lib/pay-invoice';

import { PayInvoiceLegalCard } from '@/components/pay/pay-invoice-legal-card';
import { PayInvoiceStatusBadge } from '@/components/pay/pay-invoice-status-badge';

export function PayInvoiceDocumentColumn({
  invoice,
}: Readonly<{ invoice: InvoiceView }>) {
  const { t } = useTranslation('common');
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
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

      <PayInvoiceLegalCard invoice={invoice} />

      <section
        className="rounded-2xl border border-border/50 bg-muted/[0.35] p-5 sm:p-6"
        aria-labelledby="pay-verify-authenticity"
      >
        <h2
          id="pay-verify-authenticity"
          className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {t('pay.verifyAuthenticityTitle')}
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>{t('pay.verifyAuthenticityWhat')}</p>
          <p>{t('pay.verifyAuthenticityWhere')}</p>
          <p>{t('pay.verifyAuthenticityHow')}</p>
        </div>
        <div className="mt-5 rounded-xl border border-border/50 bg-background/80 p-3.5 shadow-sm dark:bg-card/40">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t('pay.invoiceHashOnChain')}
          </p>
          <code className="mt-2 block break-all font-mono text-[11px] leading-snug text-foreground sm:text-xs">
            {invoice.invoiceHash}
          </code>
        </div>
      </section>
    </div>
  );
}
