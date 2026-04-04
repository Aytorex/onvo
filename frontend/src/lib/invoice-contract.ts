import { invoiceRegistryContract } from '@/lib/contract';
import {
  getAddress,
  isAddressEqual,
  parseEventLogs,
  zeroAddress,
  type PublicClient,
  type TransactionReceipt,
} from 'viem';

/** Checksummed `address` for UI; empty when unset (`0x…0`). Matches on-chain `worldIdAddress`. */
export function formatWorldIdAddressForDisplay(value: `0x${string}`): string {
  if (isAddressEqual(value, zeroAddress)) return '';
  return getAddress(value);
}

export type CommissionConfig = {
  commissionBps: bigint;
  commissionBpsDenominator: bigint;
  commissionRecipient: `0x${string}`;
};

export async function readCommissionConfig(
  client: PublicClient,
): Promise<CommissionConfig> {
  const [commissionBps, commissionBpsDenominator, commissionRecipient] =
    (await Promise.all([
      client.readContract({
        address: invoiceRegistryContract.address,
        abi: invoiceRegistryContract.abi,
        functionName: 'commissionBps',
      }),
      client.readContract({
        address: invoiceRegistryContract.address,
        abi: invoiceRegistryContract.abi,
        functionName: 'COMMISSION_BPS_DENOMINATOR',
      }),
      client.readContract({
        address: invoiceRegistryContract.address,
        abi: invoiceRegistryContract.abi,
        functionName: 'commissionRecipient',
      }),
    ])) as [bigint, bigint, `0x${string}`];
  return {
    commissionBps,
    commissionBpsDenominator,
    commissionRecipient,
  };
}

export async function readInvoice(
  client: PublicClient,
  invoiceId: bigint,
): Promise<{
  invoiceHash: `0x${string}`;
  emitter: `0x${string}`;
  recipient: `0x${string}`;
  amount: bigint;
  token: `0x${string}`;
  vatNumber: string;
  worldIdAddress: `0x${string}`;
  status: 0 | 1 | 2;
}> {
  const [
    invoiceHash,
    emitter,
    recipient,
    amount,
    token,
    vatNumber,
    worldIdAddress,
    status,
  ] = (await client.readContract({
    address: invoiceRegistryContract.address,
    abi: invoiceRegistryContract.abi,
    functionName: 'getInvoice',
    args: [invoiceId],
  })) as [
    `0x${string}`,
    `0x${string}`,
    `0x${string}`,
    bigint,
    `0x${string}`,
    string,
    `0x${string}`,
    number,
  ];
  return {
    invoiceHash,
    emitter,
    recipient,
    amount,
    token,
    vatNumber,
    worldIdAddress,
    status: status as 0 | 1 | 2,
  };
}

/** Nombre de factures on-chain pour cet émetteur (séquences 1..n). */
export async function readInvoiceCountForEmitter(
  client: PublicClient,
  emitter: `0x${string}`,
): Promise<bigint> {
  return (await client.readContract({
    address: invoiceRegistryContract.address,
    abi: invoiceRegistryContract.abi,
    functionName: 'getInvoiceCountForEmitter',
    args: [emitter],
  })) as bigint;
}

/** Dernier `invoiceId` créé pour cet émetteur, ou `0n` si aucune facture. Pour les précédents : `packInvoiceId` avec `seq - 1` (voir `@/lib/invoice-id`) ou multicall `getInvoice`. */
export async function readLastInvoiceIdForEmitter(
  client: PublicClient,
  emitter: `0x${string}`,
): Promise<bigint> {
  return (await client.readContract({
    address: invoiceRegistryContract.address,
    abi: invoiceRegistryContract.abi,
    functionName: 'getLastInvoiceIdForEmitter',
    args: [emitter],
  })) as bigint;
}

/**
 * On-chain registration: nullifier IDKit (`uint256`) enregistré via `bindWorldId`;
 * le contrat stocke l’identité sous forme d’`address` dérivée (`worldIdAddressFromNullifier`).
 */
export async function readWorldIdAuthorizedForEmitter(
  client: PublicClient,
  emitter: `0x${string}`,
  worldIdNullifier: bigint,
): Promise<boolean> {
  return (await client.readContract({
    address: invoiceRegistryContract.address,
    abi: invoiceRegistryContract.abi,
    functionName: 'isWorldIdAuthorizedForEmitter',
    args: [emitter, worldIdNullifier],
  })) as boolean;
}

export function parseInvoiceCreatedInvoiceId(
  receipt: TransactionReceipt,
): bigint | undefined {
  const parsed = parseEventLogs({
    abi: invoiceRegistryContract.abi,
    eventName: 'InvoiceCreated',
    logs: receipt.logs,
  }) as { args: { invoiceId?: bigint } }[];
  const first = parsed[0];
  if (!first || first.args.invoiceId === undefined) return undefined;
  return first.args.invoiceId;
}
