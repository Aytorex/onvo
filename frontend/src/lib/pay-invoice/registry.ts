import { isAddressEqual, zeroAddress } from 'viem';

import { invoiceRegistryContract } from '@/lib/contract';

export function isInvoiceRegistryConfigured(): boolean {
  return !isAddressEqual(invoiceRegistryContract.address, zeroAddress);
}

export function parseInvoiceIdParam(param: string): bigint | null {
  const trimmed = param?.trim();
  if (!trimmed || !/^[1-9]\d*$/.test(trimmed)) {
    return null;
  }
  try {
    return BigInt(trimmed);
  } catch {
    return null;
  }
}
