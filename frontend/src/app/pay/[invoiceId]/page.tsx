import { notFound } from 'next/navigation';

import { PayInvoiceContent } from '@/components/pay/pay-invoice-content';
import { PayInvoiceLoadError } from '@/components/pay/pay-invoice-load-error';
import { fetchGetInvoiceServer } from '@/lib/pay-invoice/fetch-get-invoice.server';
import {
  INVOICE_LOAD_FAILED_ERROR,
  INVOICE_REGISTRY_UNCONFIGURED_ERROR,
  isInvoiceRegistryConfigured,
  parseInvoiceIdParam,
} from '@/lib/pay-invoice';

export default async function PayInvoicePage({
  params,
}: Readonly<{
  params: Promise<{ invoiceId: string }>;
}>) {
  const { invoiceId: invoiceIdParam } = await params;
  const invoiceId = parseInvoiceIdParam(invoiceIdParam);
  if (invoiceId === null) {
    notFound();
  }

  if (!isInvoiceRegistryConfigured()) {
    return (
      <PayInvoiceLoadError message={INVOICE_REGISTRY_UNCONFIGURED_ERROR} />
    );
  }

  const fetched = await fetchGetInvoiceServer(invoiceId);
  if (!fetched.ok) {
    if (fetched.kind === 'not-found') {
      notFound();
    }
    return <PayInvoiceLoadError message={INVOICE_LOAD_FAILED_ERROR} />;
  }

  return (
    <PayInvoiceContent
      invoiceIdString={invoiceId.toString(10)}
      serializedInvoice={fetched.serializedInvoice}
    />
  );
}
