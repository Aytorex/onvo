import type { InvoiceMetaRecord } from '@/lib/invoice-types';

export function invoiceIdsKey(worldAddress: string): string {
  return `onvo_invoice_ids_${worldAddress.toLowerCase()}`;
}

export function pdfKey(invoiceId: bigint): string {
  return `onvo_invoice_${invoiceId.toString()}`;
}

export function metaKey(invoiceId: bigint): string {
  return `onvo_invoice_meta_${invoiceId.toString()}`;
}

export function getStoredInvoiceIds(worldAddress: string): bigint[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(invoiceIdsKey(worldAddress));
    if (!raw) return [];
    const arr = JSON.parse(raw) as string[];
    return arr.map((x) => BigInt(x));
  } catch {
    return [];
  }
}

export function appendInvoiceId(worldAddress: string, invoiceId: bigint): void {
  const existing = getStoredInvoiceIds(worldAddress);
  const set = new Set(existing.map((x) => x.toString()));
  set.add(invoiceId.toString());
  const sorted = [...set]
    .map((x) => BigInt(x))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  localStorage.setItem(
    invoiceIdsKey(worldAddress),
    JSON.stringify(sorted.map((x) => x.toString())),
  );
}

export function setInvoicePdfBase64(invoiceId: bigint, base64: string): void {
  localStorage.setItem(pdfKey(invoiceId), base64);
}

export function getInvoicePdfBase64(invoiceId: bigint): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(pdfKey(invoiceId));
}

export function setInvoiceMeta(
  invoiceId: bigint,
  meta: InvoiceMetaRecord,
): void {
  localStorage.setItem(metaKey(invoiceId), JSON.stringify(meta));
}

export function getInvoiceMeta(invoiceId: bigint): InvoiceMetaRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(metaKey(invoiceId));
    if (!raw) return null;
    return JSON.parse(raw) as InvoiceMetaRecord;
  } catch {
    return null;
  }
}

export function downloadBase64Pdf(base64: string, filename: string): void {
  const link = document.createElement('a');
  link.href = `data:application/pdf;base64,${base64}`;
  link.download = filename;
  link.click();
}
