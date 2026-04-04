'use client';

import { useChainId } from 'wagmi';
import { useTranslation } from 'react-i18next';

import { chains } from '@/lib/wagmi.config';
import { type InvoiceView } from '@/lib/pay-invoice';

import { PayInvoiceCopyableText } from '@/components/pay/pay-invoice-copyable-text';
import { PayInvoiceDetailRow } from '@/components/pay/pay-invoice-detail-row';

export function PayInvoiceLegalCard({
  invoice,
}: Readonly<{ invoice: InvoiceView }>) {
  const { t } = useTranslation('common');
  const chainId = useChainId();
  const chainName =
    chains.find((c) => c.id === chainId)?.name ?? `Chain ${chainId}`;
  const vatTrimmed = invoice.vatNumber.trim();

  return (
    <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
      <h2 className="mb-3 text-lg font-bold text-heading">
        {t('pay.legalTitle')}
      </h2>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        {t('pay.legalIntro')}
      </p>

      {vatTrimmed.length > 0 ? (
        <dl className="space-y-3">
          <PayInvoiceDetailRow
            label={t('pay.vatNumberOnChain')}
            value={vatTrimmed}
          />
        </dl>
      ) : null}

      <div className="mt-6 border-t border-border/60 pt-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('pay.partiesTitle')}
        </h3>
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('pay.emitter')}
            </p>
            <PayInvoiceCopyableText
              value={invoice.emitter}
              aria-label={t('pay.emitter')}
              className="mt-2 text-sm"
            />
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('pay.recipient')}
            </p>
            <PayInvoiceCopyableText
              value={invoice.recipient}
              aria-label={t('pay.recipient')}
              className="mt-2 text-sm"
            />
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('pay.network')}
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {chainName}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        {t('pay.paymentNature')}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {t('pay.issuerRecords')}
      </p>
    </section>
  );
}
