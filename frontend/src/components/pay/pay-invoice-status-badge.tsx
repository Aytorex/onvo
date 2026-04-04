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
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold',
        status === INVOICE_STATUS.Pending &&
          'border-amber-500/50 bg-amber-500/15 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200',
        status === INVOICE_STATUS.Paid &&
          'border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/45 dark:bg-emerald-500/10 dark:text-emerald-300',
        status === INVOICE_STATUS.Cancelled &&
          'border-red-500/45 bg-red-500/10 text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300',
      )}
    >
      {label}
    </Badge>
  );
}
