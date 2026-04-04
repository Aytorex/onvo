'use client';

import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function PayInvoiceLoadError({
  message,
}: Readonly<{ message: string }>) {
  const { t } = useTranslation('common');

  return (
    <Alert variant="destructive">
      <AlertTitle>{t('pay.loadError')}</AlertTitle>
      <AlertDescription className="font-mono text-xs">
        {message}
      </AlertDescription>
    </Alert>
  );
}
