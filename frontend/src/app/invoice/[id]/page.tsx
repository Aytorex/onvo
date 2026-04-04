import { InvoiceDetailClient } from '@/components/invoice/invoice-detail-client';
import {
  cropOnvoLabelMiddle,
  formatOnvoInvoiceLabel,
  parseInvoiceIdRouteParam,
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
  const parsed = parseInvoiceIdRouteParam(id);
  if (parsed !== null) {
    try {
      const full = formatOnvoInvoiceLabel(parsed);
      title = `${cropOnvoLabelMiddle(full)} · Onvo`;
    } catch {
      title = 'Facture · Onvo';
    }
  } else {
    title = 'Facture · Onvo';
  }
  return { title };
}

export default function InvoiceDetailPage() {
  return <InvoiceDetailClient />;
}
