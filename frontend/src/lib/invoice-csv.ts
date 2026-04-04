'use client';

import i18n from '@/lib/i18n/client';
import type { InvoiceMetaRecord, InvoiceRowView } from '@/lib/invoice-types';

function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function statusLabel(s: InvoiceRowView['status']): string {
  if (s === 0) return i18n.t('invoice.status.pending');
  if (s === 1) return i18n.t('invoice.status.paid');
  return i18n.t('invoice.status.cancelled');
}

export function exportInvoicesCSV(rows: InvoiceRowView[]): void {
  const headers = [
    'invoiceId',
    'status',
    'recipient',
    'amountRaw',
    'token',
    'invoiceHash',
    'invoiceNumber',
    'emitterName',
    'clientName',
    'totalTtc',
    'currency',
    'issueDate',
    'dueDate',
  ];

  const lines: string[][] = [headers];

  for (const r of rows) {
    const m: InvoiceMetaRecord | null = r.meta;
    lines.push([
      r.invoiceId.toString(),
      statusLabel(r.status),
      r.recipient,
      r.amount.toString(),
      r.token,
      r.invoiceHash,
      m?.invoiceNumber ?? '',
      m?.emitterName ?? '',
      m?.clientName ?? '',
      m != null ? String(m.totalTtc) : '',
      m?.currency ?? '',
      m?.issueDate ?? '',
      m?.dueDate ?? '',
    ]);
  }

  const csv = lines
    .map((row) => row.map((c) => escapeCsvCell(String(c))).join(','))
    .join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `onvo-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
