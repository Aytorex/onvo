'use client';

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function PayInvoiceCopyHashButton({ hash }: Readonly<{ hash: string }>) {
  const { t } = useTranslation('common');
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [hash]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0 rounded-xl"
      onClick={() => void copy()}
    >
      <Copy className="mr-1.5 h-3.5 w-3.5" />
      {copied ? t('pay.copied') : t('pay.copyHash')}
    </Button>
  );
}
