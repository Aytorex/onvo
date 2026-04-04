/** Low 96 bits: per-emitter sequence (matches `InvoiceRegistry` packing). */
const SEQ_MASK = (1n << 96n) - 1n;
const EMITTER_MASK = (1n << 160n) - 1n;

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
  return { emitter: `0x${padded}` as `0x${string}`, seq };
}

function shortHexAddress(addr: string): string {
  const hex = addr.startsWith('0x') ? addr.slice(2) : addr;
  if (hex.length < 10) return addr;
  return `${hex.slice(0, 4)}…${hex.slice(-4)}`;
}

/** Human label `F-0x<short>-<seq>` (emitter address truncated + sequence). */
export function formatOnvoInvoiceLabel(invoiceId: bigint): string {
  const { emitter, seq } = unpackPackedInvoiceId(invoiceId);
  return `F-0x${shortHexAddress(emitter)}-${seq.toString()}`;
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
 * Raccourci pour titres / listes : `headLen` premiers caractères + … + `tailLen` derniers.
 * Par défaut 5 + 17 (affichage fiche facture, onglet navigateur).
 */
export function cropOnvoLabelMiddle(
  label: string,
  headLen = 5,
  tailLen = 17,
): string {
  if (label.length <= headLen + tailLen) return label;
  return `${label.slice(0, headLen)}…${label.slice(-tailLen)}`;
}
