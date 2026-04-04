'use client';

import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePayInvoice } from '@/hooks/use-pay-invoice';

import { PayInvoiceLegalCard } from '@/components/pay/pay-invoice-legal-card';
import { PayInvoiceLoadError } from '@/components/pay/pay-invoice-load-error';
import { PayInvoiceLoading } from '@/components/pay/pay-invoice-loading';
import { PayInvoicePaymentActions } from '@/components/pay/pay-invoice-payment-actions';
import { PayInvoiceStatusAlerts } from '@/components/pay/pay-invoice-status-alerts';
import { PayInvoiceSummaryCard } from '@/components/pay/pay-invoice-summary-card';

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
    <div className="space-y-6">
      {result.isMock && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{t('pay.demoData')}</AlertDescription>
        </Alert>
      )}

      <PayInvoiceSummaryCard invoice={invoice} />
      <PayInvoiceLegalCard invoice={invoice} />
      <PayInvoiceStatusAlerts invoice={invoice} />
      <PayInvoicePaymentActions invoice={invoice} />
    </div>
  );
}
