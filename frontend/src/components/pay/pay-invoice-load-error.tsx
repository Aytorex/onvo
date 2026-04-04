'use client';

import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  INVOICE_ID_NOT_FOUND_ERROR,
  INVOICE_REGISTRY_UNCONFIGURED_ERROR,
} from '@/lib/pay-invoice';

export function PayInvoiceLoadError({
  message,
}: Readonly<{ message: string }>) {
  const { t } = useTranslation('common');

  const isRegistryMissing = message === INVOICE_REGISTRY_UNCONFIGURED_ERROR;
  const isNotFound = message === INVOICE_ID_NOT_FOUND_ERROR;

  if (isRegistryMissing) {
    return (
      <Alert
        variant="default"
        className="border-amber-500/40 bg-amber-500/5 text-foreground"
      >
        <AlertTitle>{t('pay.registryUnconfiguredTitle')}</AlertTitle>
        <AlertDescription className="text-sm">
          {t('pay.registryUnconfiguredBody')}
        </AlertDescription>
      </Alert>
    );
  }

  if (isNotFound) {
    return (
      <Alert variant="default">
        <AlertTitle>{t('pay.invoiceNotFoundTitle')}</AlertTitle>
        <AlertDescription className="text-sm">
          {t('pay.invoiceNotFoundBody')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTitle>{t('pay.loadErrorTitle')}</AlertTitle>
      <AlertDescription className="text-sm">
        {t('pay.loadErrorBody')}
      </AlertDescription>
    </Alert>
  );
}
