import { bytesToHex } from 'viem';

import { INVOICE_STATUS, type InvoiceView } from './types';

/** Demo World ID–style external ID (32-byte hex); replace when contract returns real value. */
const MOCK_ISSUER_WORLD_ID =
  '0x4a7f9c2e1b8d5a3f6c0e9d4b2a7f5c8e1d3b6a9f2c5e8d1b4a7f0c3e6d9b2a5f8';

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
    issuerWorldId: MOCK_ISSUER_WORLD_ID,
  };
}

export function generateMockTxHash(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}
