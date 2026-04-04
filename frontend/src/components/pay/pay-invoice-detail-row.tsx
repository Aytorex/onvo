import { cn } from '@/lib/utils';

export function PayInvoiceDetailRow({
  label,
  value,
  mono,
}: Readonly<{
  label: string;
  value: string;
  mono?: boolean;
}>) {
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'text-sm break-all text-foreground',
          mono && 'font-mono text-xs',
        )}
      >
        {value}
      </dd>
    </div>
  );
}
