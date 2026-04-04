import type { InvoiceMetaRecord } from '@/lib/invoice-types';

/** Primary key: World ID nullifier (stable across wallets). Falls back to wallet when nullifier unknown. */
export function invoiceIdsStorageKey(
  worldAddress: string,
  worldIdNullifier: string | null | undefined,
): string {
  const n = worldIdNullifier?.trim();
  if (n) return `onvo_invoice_ids_wid_${n}`;
  return `onvo_invoice_ids_${worldAddress.toLowerCase()}`;
}

/** @deprecated use invoiceIdsStorageKey */
export function invoiceIdsKey(worldAddress: string): string {
  return `onvo_invoice_ids_${worldAddress.toLowerCase()}`;
}

export function pdfKey(invoiceId: bigint): string {
  return `onvo_invoice_${invoiceId.toString()}`;
}

export function metaKey(invoiceId: bigint): string {
  return `onvo_invoice_meta_${invoiceId.toString()}`;
}

function readIdsFromKey(key: string): bigint[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw) as string[];
    return arr.map((x) => BigInt(x));
  } catch {
    return [];
  }
}

/** Loads invoice ids for this emitter: World ID bucket plus legacy wallet bucket (merge). */
export function getStoredInvoiceIds(
  worldAddress: string,
  worldIdNullifier?: string | null,
): bigint[] {
  if (typeof window === 'undefined') return [];
  const merge = new Set<string>();
  for (const id of readIdsFromKey(
    invoiceIdsStorageKey(worldAddress, worldIdNullifier),
  )) {
    merge.add(id.toString());
  }
  if (worldIdNullifier?.trim()) {
    for (const id of readIdsFromKey(invoiceIdsKey(worldAddress))) {
      merge.add(id.toString());
    }
  }
  return [...merge]
    .map((x) => BigInt(x))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function appendInvoiceId(
  worldAddress: string,
  invoiceId: bigint,
  worldIdNullifier?: string | null,
): void {
  const mergeIntoKey = (storageKey: string) => {
    const existing = readIdsFromKey(storageKey);
    const set = new Set(existing.map((x) => x.toString()));
    set.add(invoiceId.toString());
    const sorted = [...set]
      .map((x) => BigInt(x))
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    localStorage.setItem(
      storageKey,
      JSON.stringify(sorted.map((x) => x.toString())),
    );
  };
  mergeIntoKey(invoiceIdsStorageKey(worldAddress, worldIdNullifier));
  if (worldIdNullifier?.trim()) {
    const legacy = invoiceIdsKey(worldAddress);
    if (legacy !== invoiceIdsStorageKey(worldAddress, worldIdNullifier)) {
      mergeIntoKey(legacy);
    }
  }
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
