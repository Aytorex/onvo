import 'server-only';

import { invoiceRegistryContract } from '@/lib/contract';
import {
  type SerializedGetInvoiceTuple,
  serializeGetInvoiceTuple,
} from '@/lib/pay-invoice/get-invoice-tuple-serialized';

import { getArcPublicClientForPay } from './arc-public-client.server';

function errorBlob(err: unknown): string {
  if (err instanceof Error) {
    const c = err.cause;
    return `${err.message}${c instanceof Error ? `\n${c.message}` : ''}`;
  }
  return String(err);
}

export type FetchGetInvoiceResult =
  | { ok: true; serializedInvoice: SerializedGetInvoiceTuple }
  | { ok: false; kind: 'not-found' | 'rpc-error' };

export async function fetchGetInvoiceServer(
  invoiceId: bigint,
): Promise<FetchGetInvoiceResult> {
  const client = getArcPublicClientForPay();
  if (!client) {
    return { ok: false, kind: 'rpc-error' };
  }

  try {
    const raw = await client.readContract({
      address: invoiceRegistryContract.address,
      abi: invoiceRegistryContract.abi,
      functionName: 'getInvoice',
      args: [invoiceId],
    });
    return {
      ok: true,
      serializedInvoice: serializeGetInvoiceTuple(raw as readonly unknown[]),
    };
  } catch (e: unknown) {
    if (/InvoiceRegistry:\s*invalid id/i.test(errorBlob(e))) {
      return { ok: false, kind: 'not-found' };
    }
    return { ok: false, kind: 'rpc-error' };
  }
}
