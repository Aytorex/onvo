/** Low 96 bits: per-emitter sequence (matches `InvoiceRegistry` packing). */
const SEQ_MASK = (1n << 96n) - 1n;
const EMITTER_MASK = (1n << 160n) - 1n;

/** Decimal segment: positive base-10, no leading zeros (canonical share links). */
const DECIMAL_ID_SEGMENT = /^[1-9]\d*$/;

/**
 * Parse packed `invoiceId` from a URL segment (`/pay/…`, `/invoice/…`):
 * - **Hex** `0x` + up to 64 hex digits (compact, preferred for 256-bit packed ids)
 * - **Decimal** string (legacy / copy-paste from block explorers)
 */
export function parseInvoiceIdRouteParam(param: string): bigint | null {
  const t = param.trim();
  if (!t) return null;
  try {
    if (/^0x[0-9a-f]{1,64}$/i.test(t)) {
      return BigInt(t);
    }
    if (DECIMAL_ID_SEGMENT.test(t)) {
      return BigInt(t);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Canonical **compact** path segment for routes (hex, 32-byte padded).
 * Packed on-chain ids are ~77 decimal digits; hex is fixed 66 chars (`0x` + 64 hex).
 */
export function invoiceIdToUrlSegment(invoiceId: bigint): string {
  const hex = invoiceId.toString(16);
  return `0x${hex.padStart(64, '0')}`;
}

/** Build invoice id on-chain layout: `(uint160(emitter) << 96) | seq` (same as `InvoiceRegistry.packInvoiceId`). */
export function packInvoiceId(emitter: `0x${string}`, seq: bigint): bigint {
  if (seq <= 0n || seq > (1n << 96n) - 1n) {
    throw new Error('packInvoiceId: invalid seq');
  }
  const addr = BigInt(emitter);
  return (addr << 96n) | seq;
}

/** Decode on-chain `uint256` invoice id: high 160 bits = emitter, low 96 bits = sequence. */
export function unpackPackedInvoiceId(invoiceId: bigint): {
  emitter: `0x${string}`;
  seq: bigint;
} {
  const emitterUint = (invoiceId >> 96n) & EMITTER_MASK;
  const seq = invoiceId & SEQ_MASK;
  const padded = emitterUint.toString(16).padStart(40, '0');
  return { emitter: `0x${padded}`, seq };
}

/**
 * Human label `F-<emitter>-<seq>` — full emitter `0x` + 40 hex (no middle truncation).
 */
export function formatOnvoInvoiceLabel(invoiceId: bigint): string {
  const { emitter, seq } = unpackPackedInvoiceId(invoiceId);
  return `F-${emitter}-${seq.toString()}`;
}

const ONVO_LABEL_FULL_RE = /^(F-)(0x)([0-9a-f]{40})(-\d+-\d{2}-\d{4})$/i;

/**
 * Tronque le bloc hex (40 caractères) au milieu : `F-0x` + 3 + `…` + 3 + `-yyyy-mm-seq`.
 * Si le format ne correspond pas à une étiquette Onvo complète, renvoie la chaîne telle quelle.
 */
export function shortenOnvoInvoiceLabelString(full: string): string {
  const m = full.match(ONVO_LABEL_FULL_RE);
  if (!m) return full;
  const [, fPrefix, ox, hex, tail] = m;
  if (hex.length <= 6) return full;
  return `${fPrefix}${ox}${hex.slice(0, 3)}…${hex.slice(-3)}${tail}`;
}

/** Libellé compact pour l’UI (voir `shortenOnvoInvoiceLabelString`). */
export function formatOnvoInvoiceLabelDisplay(invoiceId: bigint): string {
  return shortenOnvoInvoiceLabelString(formatOnvoInvoiceLabel(invoiceId));
}

/**
 * Shorten only for very long strings (e.g. browser tab). Defaults allow a full Onvo label
 * (~55 chars) to display without `...`.
 */
export function cropOnvoLabelMiddle(
  label: string,
  headLen = 48,
  tailLen = 48,
): string {
  if (label.length <= headLen + tailLen) return label;
  return `${label.slice(0, headLen)}...${label.slice(-tailLen)}`;
}
