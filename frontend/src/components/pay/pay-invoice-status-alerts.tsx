'use client';

import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { INVOICE_STATUS, type InvoiceView } from '@/lib/pay-invoice';

export function PayInvoiceStatusAlerts({
  invoice,
}: Readonly<{ invoice: InvoiceView }>) {
  const { t } = useTranslation('common');

  return (
    <>
      {invoice.status === INVOICE_STATUS.Paid && (
        <Alert>
          <AlertDescription>{t('pay.alreadyPaid')}</AlertDescription>
        </Alert>
      )}
      {invoice.status === INVOICE_STATUS.Cancelled && (
        <Alert variant="destructive">
          <AlertDescription>{t('pay.cancelledNotice')}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
