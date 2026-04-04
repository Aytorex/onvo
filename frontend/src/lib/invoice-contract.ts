import { invoiceRegistryContract } from '@/lib/contract';
import {
    parseEventLogs,
    type PublicClient,
    type TransactionReceipt,
} from 'viem';

/** Decimal string for display (matches typical World IDKit nullifier formatting). */
export function formatWorldIdNullifierForDisplay(value: bigint): string {
  if (value === 0n) return '';
  return value.toString(10);
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
  worldIdNullifierHash: bigint;
  status: 0 | 1 | 2;
}> {
  const [
    invoiceHash,
    emitter,
    recipient,
    amount,
    token,
    vatNumber,
    worldIdNullifierHash,
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
    bigint,
    number,
  ];
  return {
    invoiceHash,
    emitter,
    recipient,
    amount,
    token,
    vatNumber,
    worldIdNullifierHash,
    status: status as 0 | 1 | 2,
  };
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
