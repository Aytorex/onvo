'use client';

import { useTranslation } from 'react-i18next';

import { shortAddress, type InvoiceView } from '@/lib/pay-invoice';

import { PayInvoiceDetailRow } from '@/components/pay/pay-invoice-detail-row';

export function PayInvoiceLegalCard({
  invoice,
  embedded = false,
}: Readonly<{ invoice: InvoiceView; embedded?: boolean }>) {
  const { t } = useTranslation('common');

  return (
    <section
      className={
        embedded
          ? 'rounded-3xl border border-border/70 bg-muted/10 p-5 sm:p-6'
          : 'rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-8'
      }
    >
      <h2
        className={
          embedded
            ? 'mb-3 text-base font-bold text-heading'
            : 'mb-4 text-lg font-bold text-heading'
        }
      >
        {t('pay.legalTitle')}
      </h2>
      <dl className={embedded ? 'space-y-3' : 'space-y-4'}>
        <PayInvoiceDetailRow
          label={t('pay.creditorLegalName')}
          value={t('pay.creditorMockName')}
        />
        <PayInvoiceDetailRow
          label={t('pay.creditorVat')}
          value={t('pay.creditorMockVat')}
        />
        <PayInvoiceDetailRow
          label={t('pay.emitter')}
          value={shortAddress(invoice.emitter, 8)}
          mono
        />
        <PayInvoiceDetailRow
          label={t('pay.debtorNote')}
          value={shortAddress(invoice.recipient, 8)}
          mono
        />
      </dl>
      <p
        className={
          embedded
            ? 'mt-4 text-xs leading-relaxed text-muted-foreground'
            : 'mt-6 text-xs leading-relaxed text-muted-foreground'
        }
      >
        {t('pay.paymentNature')}
      </p>
      <p
        className={
          embedded
            ? 'mt-2 text-xs leading-relaxed text-muted-foreground'
            : 'mt-3 text-xs leading-relaxed text-muted-foreground'
        }
      >
        {t('pay.issuerRecords')}
      </p>
    </section>
  );
}
