import { bytesToHex } from 'viem';

import { INVOICE_STATUS, type InvoiceView } from './types';

export function getMockInvoice(invoiceId: bigint): InvoiceView {
  const hashSeed = invoiceId * BigInt(7919) + BigInt(13);
  const hex = hashSeed.toString(16).padStart(64, '0').slice(0, 64);
  return {
    invoiceId,
    invoiceHash: `0x${hex}`,
    emitter: '0x1111111111111111111111111111111111111111',
    recipient: '0x2222222222222222222222222222222222222222',
    token: '0x3333333333333333333333333333333333333333',
    amount: BigInt(1_500_000),
    status: INVOICE_STATUS.Pending,
  };
}

export function generateMockTxHash(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}
