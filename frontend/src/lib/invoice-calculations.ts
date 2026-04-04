import type { InvoiceLine } from '@/lib/invoice-types';

export function computeLineSubtotal(lines: InvoiceLine[]): number {
  return lines.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0);
}

export function computeTotals(subtotal: number, vatPercent: number) {
  const totalHt = subtotal;
  const tvaAmount = (totalHt * vatPercent) / 100;
  const totalTtc = totalHt + tvaAmount;
  return { totalHt, tvaAmount, totalTtc };
}
