'use client';

import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePayInvoice } from '@/hooks/use-pay-invoice';

import { PayInvoiceDocumentColumn } from '@/components/pay/pay-invoice-document-column';
import { PayInvoiceLoadError } from '@/components/pay/pay-invoice-load-error';
import { PayInvoiceLoading } from '@/components/pay/pay-invoice-loading';
import { PayInvoiceStatusAlerts } from '@/components/pay/pay-invoice-status-alerts';
import { PayInvoicePaymentColumn } from '@/components/pay/pay-invoice-payment-column';

export function PayInvoiceContent({
  invoiceId,
}: Readonly<{ invoiceId: bigint }>) {
  const { t } = useTranslation('common');
  const result = usePayInvoice(invoiceId);

  if (result.status === 'loading') {
    return <PayInvoiceLoading />;
  }

  if (result.status === 'error') {
    return <PayInvoiceLoadError message={result.error.message} />;
  }

  const invoice = result.invoice;

  return (
    <div className="space-y-6 lg:space-y-8">
      {result.isMock && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{t('pay.demoData')}</AlertDescription>
        </Alert>
      )}

      <PayInvoiceStatusAlerts invoice={invoice} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <PayInvoiceDocumentColumn invoice={invoice} />
        </div>
        <div className="lg:col-span-5">
          <PayInvoicePaymentColumn invoice={invoice} />
        </div>
      </div>
    </div>
  );
}
