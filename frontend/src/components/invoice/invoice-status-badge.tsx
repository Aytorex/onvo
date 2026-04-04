'use client';

import { Badge } from '@/components/ui/badge';

const statusBadgeClass =
  'inline-flex shrink-0 whitespace-nowrap [max-width:max-content]';

/** Même rendu que la colonne Statut du tableau des factures. */
export function InvoiceStatusBadge({
  status,
  t,
}: {
  status: 0 | 1 | 2;
  t: (key: string) => string;
}) {
  if (status === 0)
    return (
      <Badge
        variant="outline"
        className={`border-amber-500/60 text-amber-400 ${statusBadgeClass}`}
      >
        {t('invoice.status.pending')}
      </Badge>
    );
  if (status === 1)
    return (
      <Badge
        variant="outline"
        className={`border-emerald-500/60 text-emerald-400 ${statusBadgeClass}`}
      >
        {t('invoice.status.paid')}
      </Badge>
    );
  return (
    <Badge
      variant="secondary"
      className={`text-muted-foreground ${statusBadgeClass}`}
    >
      {t('invoice.status.cancelled')}
    </Badge>
  );
}
