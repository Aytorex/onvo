import { getAddress } from 'viem';

const SEQ_MASK = (1n << 40n) - 1n;
const ADDR_MASK = (1n << 160n) - 1n;

/** Unpack on-chain `uint256` invoice id (matches `InvoiceRegistry` layout). */
export function unpackPackedInvoiceId(invoiceId: bigint): {
  emitter: `0x${string}`;
  year: number;
  month: number;
  sequence: number;
} {
  const emitterN = (invoiceId >> 96n) & ADDR_MASK;
  const emitter =
    `0x${emitterN.toString(16).padStart(40, '0')}` as `0x${string}`;
  const year = Number((invoiceId >> 80n) & 0xffffn);
  const month = Number((invoiceId >> 72n) & 0xffn);
  const sequence = Number(invoiceId & SEQ_MASK);
  return { emitter, year, month, sequence };
}

/** Human label `F-<emitter>-<yyyy>-<mm>-<seq>` (checksum address). */
export function formatOnvoInvoiceLabel(invoiceId: bigint): string {
  const { emitter, year, month, sequence } = unpackPackedInvoiceId(invoiceId);
  const mo = month.toString().padStart(2, '0');
  const seq = sequence.toString().padStart(4, '0');
  return `F-${getAddress(emitter)}-${year}-${mo}-${seq}`;
}
