import { Badge } from '@/components/ui/badge';
import { INVOICE_STATUS, type InvoiceView } from '@/lib/pay-invoice';
import { cn } from '@/lib/utils';

export function PayInvoiceStatusBadge({
  status,
  label,
}: Readonly<{
  status: InvoiceView['status'];
  label: string;
}>) {
  let variant: 'outline' | 'destructive' | 'secondary' = 'secondary';
  if (status === INVOICE_STATUS.Paid) {
    variant = 'outline';
  } else if (status === INVOICE_STATUS.Cancelled) {
    variant = 'destructive';
  }
  return (
    <Badge
      variant={variant}
      className={cn(
        status === INVOICE_STATUS.Paid &&
          'border-emerald-500/40 text-emerald-700 dark:border-emerald-500/50 dark:text-emerald-400',
      )}
    >
      {label}
    </Badge>
  );
}
