import { InvoiceDetailClient } from '@/components/invoice/invoice-detail-client';
import {
  formatOnvoInvoiceLabel,
  shortenOnvoInvoiceLabelString,
} from '@/lib/invoice-id';
import type { Metadata } from 'next';

type PageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  let title = 'Onvo';
  try {
    const full = formatOnvoInvoiceLabel(BigInt(id));
    title = `${shortenOnvoInvoiceLabelString(full)} · Onvo`;
  } catch {
    title = 'Facture · Onvo';
  }
  return { title };
}

export default function InvoiceDetailPage() {
  return <InvoiceDetailClient />;
}
