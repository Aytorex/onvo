'use client';

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

export function PayInvoiceCopyableText({
  value,
  className,
  mono = true,
  'aria-label': ariaLabel,
}: Readonly<{
  value: string;
  className?: string;
  mono?: boolean;
  'aria-label'?: string;
}>) {
  const { t } = useTranslation('common');
  const [copied, setCopied] = useState(false);

  const onClick = useCallback(() => {
    if (!value) return;
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [value]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        title={t('pay.clickToCopyFull')}
        aria-label={ariaLabel ?? t('pay.clickToCopyFull')}
        className={cn(
          'w-full rounded-lg border border-transparent bg-transparent text-left transition-colors',
          'hover:border-border hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          mono && 'font-mono text-sm break-all text-foreground',
          className,
        )}
      >
        {value}
      </button>
      {copied ? (
        <span className="mt-1 block text-xs text-emerald-600 dark:text-emerald-400">
          {t('pay.copied')}
        </span>
      ) : null}
    </div>
  );
}
