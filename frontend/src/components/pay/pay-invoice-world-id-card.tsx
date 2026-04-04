'use client';

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Fingerprint } from 'lucide-react';

import { cn } from '@/lib/utils';

export function PayInvoiceWorldIdCard({
  issuerWorldId,
  compact = false,
}: Readonly<{ issuerWorldId: string; compact?: boolean }>) {
  const { t } = useTranslation('common');
  const hasId = issuerWorldId.length > 0;
  const [copied, setCopied] = useState(false);

  const copyId = useCallback(() => {
    if (!hasId) return;
    void navigator.clipboard.writeText(issuerWorldId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [hasId, issuerWorldId]);

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl border bg-card shadow-sm',
        'border-onvo-purple/25 bg-gradient-to-br from-card via-card to-onvo-purple/[0.06]',
        'dark:border-onvo-purple/35 dark:to-onvo-cyan/[0.04]',
        compact ? 'p-4 sm:p-5' : 'p-6 shadow-sm sm:p-8',
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-onvo-purple/10 to-onvo-cyan/10 blur-2xl" />
      <div className="relative flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-onvo-purple/20 to-onvo-cyan/15 text-onvo-purple dark:from-onvo-purple/30 dark:to-onvo-cyan/20 dark:text-onvo-cyan">
            <Fingerprint className="h-4 w-4" aria-hidden />
          </div>
          <h2 className="text-base font-bold leading-tight text-heading">
            {t('pay.worldIdCardTitle')}
          </h2>
        </div>

        <p className="text-xs leading-snug text-amber-900/90 dark:text-amber-200/95">
          {t('pay.worldIdComparePdf')}
        </p>

        {hasId ? (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {t('pay.worldIdLabel')}
            </p>
            <button
              type="button"
              onClick={copyId}
              title={t('pay.clickToCopyFull')}
              className={cn(
                'mt-1 w-full rounded-lg border border-border/60 bg-muted/20 px-2 py-2 text-left transition-colors',
                'hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'font-mono text-[11px] leading-snug tracking-tight text-foreground sm:text-xs',
                'break-all',
              )}
            >
              {issuerWorldId}
            </button>
            {copied ? (
              <span className="mt-1 block text-xs text-emerald-600 dark:text-emerald-400">
                {t('pay.copied')}
              </span>
            ) : (
              <span className="mt-1 block text-[10px] text-muted-foreground">
                {t('pay.tapIdToCopy')}
              </span>
            )}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border/80 bg-muted/15 px-3 py-2 text-xs text-muted-foreground">
            {t('pay.worldIdUnavailable')}
          </p>
        )}
      </div>
    </section>
  );
}
