import type { InvoiceLine } from '@/lib/invoice-types';

/** Montant HT d'une ligne (hors TVA). */
export function computeLineHt(line: InvoiceLine): number {
  return line.quantity * line.unitPrice;
}

/** Montant TVA pour une ligne. */
export function computeLineVatAmount(line: InvoiceLine): number {
  return (computeLineHt(line) * line.vatPercent) / 100;
}

/** Total TTC d'une ligne. */
export function computeLineTtc(line: InvoiceLine): number {
  return computeLineHt(line) + computeLineVatAmount(line);
}

/** Somme des montants HT (toutes lignes). */
export function computeTotalHt(lines: InvoiceLine[]): number {
  return lines.reduce((acc, l) => acc + computeLineHt(l), 0);
}

/** Agrégats facture à partir des lignes (TVA par ligne). */
export function computeTotalsFromLines(lines: InvoiceLine[]): {
  totalHt: number;
  tvaAmount: number;
  totalTtc: number;
} {
  let totalHt = 0;
  let tvaAmount = 0;
  for (const l of lines) {
    const ht = computeLineHt(l);
    const tva = computeLineVatAmount(l);
    totalHt += ht;
    tvaAmount += tva;
  }
  return {
    totalHt,
    tvaAmount,
    totalTtc: totalHt + tvaAmount,
  };
}
