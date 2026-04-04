import {
  decodeAbiParameters,
  encodeAbiParameters,
  type AbiParameter,
  type Hex,
} from 'viem';

/**
 * ABI of `getInvoice` return values (must match `InvoiceRegistry.sol` / `contract.ts`).
 * Used to ABI-encode the tuple for RSC → client transport (JSON-safe hex string).
 */
export const GET_INVOICE_OUTPUT_ABI = [
  { name: 'invoiceHash_', type: 'bytes32' },
  { name: 'emitter', type: 'address' },
  { name: 'recipient', type: 'address' },
  { name: 'amount', type: 'uint256' },
  { name: 'token', type: 'address' },
  { name: 'vatNumber', type: 'string' },
  { name: 'worldIdAddress_', type: 'address' },
  { name: 'status', type: 'uint8' },
] as const satisfies readonly AbiParameter[];

export type SerializedGetInvoiceTuple = Hex;

/** ABI-encodes the `getInvoice` tuple (hex string, safe for JSON / RSC props). */
export function serializeGetInvoiceTuple(
  values: readonly unknown[],
): SerializedGetInvoiceTuple {
  return encodeAbiParameters([...GET_INVOICE_OUTPUT_ABI], values as never);
}

/** ABI-decodes transport hex back to the same tuple shape as `readContract`. */
export function decodeGetInvoiceTuple(
  encoded: SerializedGetInvoiceTuple,
): readonly unknown[] {
  const decoded = decodeAbiParameters([...GET_INVOICE_OUTPUT_ABI], encoded);
  return [...decoded];
}
