import { encodePacked, keccak256 } from 'viem';

const SEQ_MASK = (1n << 40n) - 1n;
const PACKED160_MASK = (1n << 160n) - 1n;

/** Lower 160 bits of keccak256(abi.encodePacked(nullifier)) — matches `InvoiceRegistry.worldIdNullifierToPacked160`. */
export function worldIdNullifierToPacked160(nullifier: bigint): bigint {
  const h = keccak256(encodePacked(['uint256'], [nullifier]));
  return BigInt(h) & PACKED160_MASK;
}

/** Unpack on-chain `uint256` invoice id (matches `InvoiceRegistry` layout). */
export function unpackPackedInvoiceId(invoiceId: bigint): {
  worldIdPacked: bigint;
  year: number;
  month: number;
  sequence: number;
} {
  const worldIdPacked = (invoiceId >> 96n) & PACKED160_MASK;
  const year = Number((invoiceId >> 80n) & 0xffffn);
  const month = Number((invoiceId >> 72n) & 0xffn);
  const sequence = Number(invoiceId & SEQ_MASK);
  return { worldIdPacked, year, month, sequence };
}

/** Human label `F-0x<wid160>-<yyyy>-<mm>-<seq>` (wid160 = 40 hex chars, lower keccak limb). */
export function formatOnvoInvoiceLabel(invoiceId: bigint): string {
  const { worldIdPacked, year, month, sequence } =
    unpackPackedInvoiceId(invoiceId);
  const mo = month.toString().padStart(2, '0');
  const seq = sequence.toString().padStart(4, '0');
  const hex = worldIdPacked.toString(16).padStart(40, '0');
  return `F-0x${hex}-${year}-${mo}-${seq}`;
}
