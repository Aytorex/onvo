'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PayInvoiceNotFound() {
  const { t } = useTranslation('common');
  const params = useParams();
  const invoiceId = params.invoiceId;

  return (
    <section
      className="rounded-3xl border border-border/80 bg-card p-8 shadow-sm sm:p-10"
      aria-labelledby="pay-not-found-heading"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        404
      </p>
      <h1
        id="pay-not-found-heading"
        className="mt-2 text-2xl font-bold tracking-tight text-heading sm:text-3xl"
      >
        {t('pay.notFoundTitle')}
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
        {t('pay.notFoundBody', { invoiceId: invoiceId ?? '' })}
      </p>
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: 'default', size: 'sm' }),
          'mt-8 inline-flex rounded-xl',
        )}
      >
        {t('pay.notFoundHome')}
      </Link>
    </section>
  );
}
