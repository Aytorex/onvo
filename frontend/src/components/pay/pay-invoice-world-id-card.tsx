'use client';

import { useTranslation } from 'react-i18next';
import { Fingerprint } from 'lucide-react';

import { cn } from '@/lib/utils';

import { PayInvoiceCopyHashButton } from '@/components/pay/pay-invoice-copy-hash-button';

export function PayInvoiceWorldIdCard({
  issuerWorldId,
}: Readonly<{ issuerWorldId: string }>) {
  const { t } = useTranslation('common');
  const hasId = issuerWorldId.length > 0;

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm sm:p-8',
        'border-onvo-purple/25 bg-gradient-to-br from-card via-card to-onvo-purple/[0.06]',
        'dark:border-onvo-purple/35 dark:to-onvo-cyan/[0.04]',
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-onvo-purple/10 to-onvo-cyan/10 blur-2xl" />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-onvo-purple/20 to-onvo-cyan/15 text-onvo-purple dark:from-onvo-purple/30 dark:to-onvo-cyan/20 dark:text-onvo-cyan">
            <Fingerprint className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-bold text-heading">
              {t('pay.worldIdCardTitle')}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t('pay.worldIdCardIntro')}
            </p>
          </div>
        </div>

        <p className="text-sm font-medium text-amber-900/90 dark:text-amber-200/95">
          {t('pay.worldIdComparePdf')}
        </p>

        {hasId ? (
          <div className="rounded-xl border border-border/70 bg-muted/25 p-4 dark:bg-muted/20">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('pay.worldIdLabel')}
            </p>
            <code className="mt-2 block break-all font-mono text-xs leading-relaxed text-foreground sm:text-sm">
              {issuerWorldId}
            </code>
            <div className="mt-3">
              <PayInvoiceCopyHashButton hash={issuerWorldId} />
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
            {t('pay.worldIdUnavailable')}
          </p>
        )}
      </div>
    </section>
  );
}
