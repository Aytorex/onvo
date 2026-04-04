/**
 * InvoiceRegistry — Arc / Hardhat. Set NEXT_PUBLIC_INVOICE_REGISTRY_ADDRESS after deploy.
 * ABI synced from `backend/artifacts/.../InvoiceRegistry.json` (see `invoice-registry-abi.json`).
 */
import type { Abi } from 'viem';

import invoiceRegistryAbi from './invoice-registry-abi.json';

const rawAddress =
  process.env.NEXT_PUBLIC_INVOICE_REGISTRY_ADDRESS?.trim() ||
  '0x0000000000000000000000000000000000000000';

const rawChainId = process.env.NEXT_PUBLIC_INVOICE_REGISTRY_CHAIN_ID?.trim();

export const invoiceRegistryContract = {
  address: rawAddress as `0x${string}`,
  chainId: rawChainId ? Number(rawChainId) : undefined,
  fromBlock: BigInt(process.env.NEXT_PUBLIC_INVOICE_REGISTRY_FROM_BLOCK ?? '0'),
  abi: invoiceRegistryAbi as Abi,
};

/** Dev 1 ABI / address — aliases for `import { INVOICE_REGISTRY_ABI } from '@/lib/contract'`. */
export const INVOICE_REGISTRY_ADDRESS = invoiceRegistryContract.address;
export const INVOICE_REGISTRY_ABI = invoiceRegistryContract.abi;
