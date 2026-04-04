'use client';

import { use } from 'react';
import { useTranslation } from 'react-i18next';

import { PayInvoiceContent } from '@/components/pay/pay-invoice-content';
import { parseInvoiceIdParam } from '@/lib/pay-invoice';

export default function PayInvoicePage({
  params,
}: Readonly<{
  params: Promise<{ invoiceId: string }>;
}>) {
  const { invoiceId: invoiceIdParam } = use(params);
  const { t } = useTranslation('common');

  const invoiceId = parseInvoiceIdParam(invoiceIdParam);

  if (invoiceId === null) {
    return (
      <section
        className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-8"
        aria-labelledby="pay-heading"
      >
        <h1
          id="pay-heading"
          className="text-xl font-bold tracking-tight text-heading sm:text-2xl"
        >
          {t('pay.title')}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t('pay.invalidInvoiceId')}
        </p>
      </section>
    );
  }

  return <PayInvoiceContent invoiceId={invoiceId} />;
}
