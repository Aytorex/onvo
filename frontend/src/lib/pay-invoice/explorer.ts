import { arcTestnet } from 'viem/chains';

import { chains } from '@/lib/wagmi.config';

const ARC_TESTNET_EXPLORER_FALLBACK = 'https://testnet.arcscan.app';

/** Blockscout REST API base (matches viem `arcTestnet` block explorer host + `/api`). */
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
export function explorerTxUrl(txHash: string, chainId?: number): string | null {
  const base =
    chainId !== undefined
      ? getExplorerBaseUrl(chainId)
      : (process.env.NEXT_PUBLIC_CHAIN_EXPLORER_URL?.replace(/\/$/, '') ?? '');
  if (!base) {
    return null;
  }
  return `${base}/tx/${txHash}`;
}

/** @deprecated Use `explorerTxUrl` — same function. */
export const txExplorerUrl = explorerTxUrl;

export type ArcScanTokenMeta = {
  name: string | null;
  symbol: string | null;
  decimals: number | null;
};

function parseDecimals(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Parses Blockscout `/api/v2/tokens/{address}` JSON defensively. */
export function parseArcScanTokenJson(data: unknown): ArcScanTokenMeta | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const o = data as Record<string, unknown>;
  if (
    typeof o.message === 'string' &&
    o.message.toLowerCase().includes('not found')
  ) {
    return null;
  }
  const name = typeof o.name === 'string' ? o.name : null;
  const symbol = typeof o.symbol === 'string' ? o.symbol : null;
  const decimals = parseDecimals(o.decimals);
  if (!name && !symbol && decimals === null) {
    return null;
  }
  return { name, symbol, decimals };
}

/**
 * Loads token metadata from the ArcScan REST API (via same-origin proxy on the client).
 * Returns `null` on failure; callers should fall back to `getTokenMeta`.
 */
export async function fetchArcScanTokenMeta(
  tokenAddress: `0x${string}`,
  chainId: number,
): Promise<ArcScanTokenMeta | null> {
  if (chainId !== arcTestnet.id) {
    return null;
  }
  const normalized = tokenAddress.toLowerCase();
  try {
    const res = await fetch(`/api/arcscan/token/${normalized}`);
    if (!res.ok) {
      return null;
    }
    const json: unknown = await res.json();
    return parseArcScanTokenJson(json);
  } catch {
    return null;
  }
}
