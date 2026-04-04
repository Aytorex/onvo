import { formatOnvoInvoiceLabel } from '@/lib/invoice-id';
import type { InvoiceRowView } from '@/lib/invoice-types';
import { getTokenAddress, tokenDecimals } from '@/lib/invoice-tokens';

export function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function tokenSymbolForAddress(token: `0x${string}`): string {
  const usdc = getTokenAddress('USDC').toLowerCase();
  const eurc = getTokenAddress('EURC').toLowerCase();
  const t = token.toLowerCase();
  if (t === usdc) return 'USDC';
  if (t === eurc) return 'EURC';
  return 'TOKEN';
}

export function formatInvoiceTokenAmount(
  amount: bigint,
  token: `0x${string}`,
): string {
  const dec = tokenDecimals();
  const n = Number(amount) / 10 ** dec;
  if (!Number.isFinite(n)) return amount.toString();
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export type InvoiceListStatusFilter = 'all' | 'pending' | 'paid' | 'cancelled';

export function buildInvoiceRowSearchText(r: InvoiceRowView): string {
  const sym = tokenSymbolForAddress(r.token);
  const amt = formatInvoiceTokenAmount(r.amount, r.token);
  const parts: string[] = [
    formatOnvoInvoiceLabel(r.invoiceId),
    r.invoiceId.toString(),
    r.recipient,
    r.recipient.slice(2),
    r.token,
    r.token.slice(2),
    r.invoiceHash,
    r.invoiceHash.slice(2),
    r.amount.toString(),
    amt,
    sym,
  ];
  if (r.meta) {
    parts.push(
      r.meta.invoiceNumber ?? '',
      r.meta.clientName ?? '',
      r.meta.clientEmail ?? '',
      r.meta.emitterName ?? '',
    );
  }
  return parts.join(' ').toLowerCase();
}

export function filterInvoiceRows(
  rows: InvoiceRowView[],
  search: string,
  status: InvoiceListStatusFilter,
): InvoiceRowView[] {
  const q = search.trim().toLowerCase();
  return rows.filter((r) => {
    if (status === 'pending' && r.status !== 0) return false;
    if (status === 'paid' && r.status !== 1) return false;
    if (status === 'cancelled' && r.status !== 2) return false;
    if (!q) return true;
    return buildInvoiceRowSearchText(r).includes(q);
  });
}
