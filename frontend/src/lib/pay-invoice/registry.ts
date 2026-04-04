import { isAddressEqual, zeroAddress } from 'viem';

import { invoiceRegistryContract } from '@/lib/contract';

/** `usePayInvoice` error `message` when the registry env address is unset. */
export const INVOICE_REGISTRY_UNCONFIGURED_ERROR =
  'INVOICE_REGISTRY_UNCONFIGURED';

/** `getInvoice` reverted: no invoice at this id (`_requireInvoice` / `InvoiceRegistry: invalid id`). */
export const INVOICE_ID_NOT_FOUND_ERROR = 'INVOICE_ID_NOT_FOUND';

/** RPC, parse, or other failure after normalization (no raw viem text in UI). */
export const INVOICE_LOAD_FAILED_ERROR = 'INVOICE_LOAD_FAILED';

/** Maps wagmi/viem read errors to stable codes for i18n (strips long contract client messages). */
export function normalizeGetInvoiceReadError(error: unknown): Error {
  const blob = collectErrorText(error);
  if (/InvoiceRegistry:\s*invalid id/i.test(blob)) {
    return new Error(INVOICE_ID_NOT_FOUND_ERROR);
  }
  return new Error(INVOICE_LOAD_FAILED_ERROR);
}

function collectErrorText(error: unknown): string {
  const parts: string[] = [];
  let e: unknown = error;
  for (let depth = 0; e != null && depth < 6; depth++) {
    if (e instanceof Error) {
      parts.push(e.message);
      e = e.cause;
    } else if (typeof e === 'object' && e !== null && 'shortMessage' in e) {
      parts.push(String((e as { shortMessage?: string }).shortMessage));
      e = undefined;
    } else if (typeof e === 'object' && e !== null) {
      try {
        parts.push(JSON.stringify(e));
      } catch {
        parts.push('[object]');
      }
      e = undefined;
    } else {
      parts.push(formatUnknownLeaf(e));
      e = undefined;
    }
  }
  return parts.join('\n');
}

function formatUnknownLeaf(e: unknown): string {
  switch (typeof e) {
    case 'string':
      return e;
    case 'number':
    case 'boolean':
    case 'bigint':
      return String(e);
    case 'symbol':
      return e.toString();
    case 'function':
      return `[function:${e.name || 'anonymous'}]`;
    case 'undefined':
      return 'undefined';
    default:
      return 'unknown';
  }
}

export function isInvoiceRegistryConfigured(): boolean {
  return !isAddressEqual(invoiceRegistryContract.address, zeroAddress);
}

/** `/pay/[invoiceId]` segment: positive base-10 integer, no leading zeros. */
const PAY_INVOICE_ID_SEGMENT = /^[1-9]\d*$/;

export function parseInvoiceIdParam(param: string): bigint | null {
  const t = param.trim();
  if (!PAY_INVOICE_ID_SEGMENT.test(t)) {
    return null;
  }
  try {
    return BigInt(t);
  } catch {
    return null;
  }
}
