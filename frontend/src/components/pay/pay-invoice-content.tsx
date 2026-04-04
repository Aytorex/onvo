'use client';

import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { useChainId } from 'wagmi';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { useArcScanTokenInfo } from '@/hooks/use-arcscan-token';
import { usePayInvoice } from '@/hooks/use-pay-invoice';

import { PayInvoiceDocumentColumn } from '@/components/pay/pay-invoice-document-column';
import { PayInvoiceLoadError } from '@/components/pay/pay-invoice-load-error';
import { PayInvoiceLoading } from '@/components/pay/pay-invoice-loading';
import { PayInvoicePaymentColumn } from '@/components/pay/pay-invoice-payment-column';
import { PayInvoiceStatusAlerts } from '@/components/pay/pay-invoice-status-alerts';

export function PayInvoiceContent({
  invoiceId,
}: Readonly<{ invoiceId: bigint }>) {
  const { t } = useTranslation('common');
  const result = usePayInvoice(invoiceId);
  const chainId = useChainId();
  const tokenForArc =
    result.status === 'ready' ? result.invoice.token : undefined;
  const arcTokenInfo = useArcScanTokenInfo(tokenForArc, chainId);

  if (result.status === 'loading') {
    return <PayInvoiceLoading />;
  }

  if (result.status === 'error') {
    return <PayInvoiceLoadError message={result.error.message} />;
  }

  const invoice = result.invoice;

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-8">
      {result.isMock && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{t('pay.demoData')}</AlertDescription>
        </Alert>
      )}

      <PayInvoiceStatusAlerts invoice={invoice} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch lg:gap-10">
        <div className="min-w-0 lg:col-span-7">
          <PayInvoiceDocumentColumn
            invoice={invoice}
            chainId={chainId}
            arcTokenInfo={arcTokenInfo}
          />
        </div>
        <div className="flex h-full min-h-0 min-w-0 flex-col lg:col-span-5">
          <PayInvoicePaymentColumn invoice={invoice} chainId={chainId} />
        </div>
      </div>
    </div>
  );
}
