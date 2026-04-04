'use server';

import { fetchGetInvoiceServer } from '@/lib/pay-invoice/fetch-get-invoice.server';

/** Re-read invoice on-chain after payment (RPC runs on the server, not in the browser). */
export async function refreshPayInvoiceSerialized(invoiceIdDecimalString: string) {
  return fetchGetInvoiceServer(BigInt(invoiceIdDecimalString));
}
