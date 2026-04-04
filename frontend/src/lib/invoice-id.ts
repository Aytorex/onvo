/** Low 96 bits: per-emitter sequence (matches `InvoiceRegistry` packing). */
const SEQ_MASK = (1n << 96n) - 1n;
const EMITTER_MASK = (1n << 160n) - 1n;

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
