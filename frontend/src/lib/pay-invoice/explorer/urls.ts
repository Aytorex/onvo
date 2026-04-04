import { arcTestnet } from 'viem/chains';

import { chains } from '@/lib/wagmi.config';

const ARC_TESTNET_EXPLORER_FALLBACK = 'https://testnet.arcscan.app';

/** Blockscout REST API base (viem `arcTestnet` explorer host + `/api`). */
export function getArcScanApiBaseUrl(chainId: number): string | null {
  if (chainId !== arcTestnet.id) {
    return null;
  }
  return `${getExplorerBaseUrl(chainId)}/api`;
}

export function getExplorerBaseUrl(chainId: number): string {
  const chain = chains.find((c) => c.id === chainId);
  const fromChain = chain?.blockExplorers?.default?.url?.replace(/\/$/, '');
  if (fromChain) {
    return fromChain;
  }
  if (chainId === arcTestnet.id) {
    return ARC_TESTNET_EXPLORER_FALLBACK;
  }
  return '';
}

export function tokenExplorerUrl(
  chainId: number,
  tokenAddress: string,
): string | null {
  const base = getExplorerBaseUrl(chainId);
  if (!base) {
    return null;
  }
  return `${base}/token/${tokenAddress}`;
}

export function addressExplorerUrl(
  chainId: number,
  address: string,
): string | null {
  const base = getExplorerBaseUrl(chainId);
  if (!base) {
    return null;
  }
  return `${base}/address/${address}`;
}

/**
 * Transaction URL on the chain explorer. Pass `chainId` to use the configured
 * chain explorer; otherwise falls back to `NEXT_PUBLIC_CHAIN_EXPLORER_URL`.
 */
export function explorerTxUrl(
  txHash: string,
  chainId?: number,
): string | null {
  const base =
    chainId !== undefined
      ? getExplorerBaseUrl(chainId)
      : process.env.NEXT_PUBLIC_CHAIN_EXPLORER_URL?.replace(/\/$/, '') ?? '';
  if (!base) {
    return null;
  }
  return `${base}/tx/${txHash}`;
}

/** @deprecated Use `explorerTxUrl` — same function. */
export const txExplorerUrl = explorerTxUrl;
