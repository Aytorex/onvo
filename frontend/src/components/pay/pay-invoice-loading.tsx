'use client';

import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

export function PayInvoiceLoading() {
  const { t } = useTranslation('common');

  return (
    <section
      className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-8"
      aria-busy
      aria-label={t('pay.title')}
    >
      <Skeleton className="mb-4 h-8 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-24 w-full" />
      </div>
    </section>
  );
}
