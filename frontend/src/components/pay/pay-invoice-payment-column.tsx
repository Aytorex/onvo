'use client';

import type { InvoiceView } from '@/lib/pay-invoice';

import { PayInvoicePaymentActions } from '@/components/pay/pay-invoice-payment-actions';
import { PayInvoiceRegistryPanel } from '@/components/pay/pay-invoice-registry-panel';
import { PayInvoiceWorldIdCard } from '@/components/pay/pay-invoice-world-id-card';
import { cn } from '@/lib/utils';

export function PayInvoicePaymentColumn({
  invoice,
  chainId,
  onPaymentConfirmed,
}: Readonly<{
  invoice: InvoiceView;
  chainId: number;
  onPaymentConfirmed: () => void;
}>) {
  return (
    <aside className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'flex min-h-0 w-full flex-col gap-4',
          'lg:sticky lg:top-24 lg:z-10',
          'lg:max-h-[calc(100dvh-6.5rem)] lg:overflow-y-auto lg:overscroll-y-contain lg:pr-0.5',
          'lg:rounded-2xl lg:bg-background/95 lg:shadow-md lg:shadow-black/[0.06] lg:backdrop-blur-sm dark:lg:bg-background/90',
        )}
      >
        <PayInvoicePaymentActions
          invoice={invoice}
          onPaymentConfirmed={onPaymentConfirmed}
        />

        <PayInvoiceWorldIdCard issuerWorldId={invoice.issuerWorldId} compact />

        <PayInvoiceRegistryPanel chainId={chainId} />
      </div>
    </aside>
  );
}
