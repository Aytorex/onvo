import { readInvoiceCountForEmitter } from '@/lib/invoice-contract';
import { getStoredInvoiceIds } from '@/lib/invoice-storage';
import { packInvoiceId } from '@/lib/invoice-id';
import type { PublicClient } from 'viem';

/**
 * Union: localStorage ids (per World ID / wallet) + ids derivable on-chain
 * from `getInvoiceCountForEmitter` and `packInvoiceId(emitter, seq)`.
 */
export async function getMergedEmitterInvoiceIds(
  client: PublicClient,
  emitter: `0x${string}`,
  worldAddress: string,
  worldIdNullifier: string | null | undefined,
): Promise<bigint[]> {
  const count = await readInvoiceCountForEmitter(client, emitter);
  const onChain: bigint[] = [];
  for (let seq = 1n; seq <= count; seq += 1n) {
    onChain.push(packInvoiceId(emitter, seq));
  }
  const stored = getStoredInvoiceIds(worldAddress, worldIdNullifier);
  const merge = new Set<string>();
  for (const id of onChain) merge.add(id.toString());
  for (const id of stored) merge.add(id.toString());
  const sorted = [...merge].map(BigInt);
  sorted.sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
  return sorted;
}
