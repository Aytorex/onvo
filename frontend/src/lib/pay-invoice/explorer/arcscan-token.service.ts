import { arcTestnet } from 'viem/chains';

import type { ArcScanTokenMeta } from './arcscan-token.types';

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
 * Loads token metadata from ArcScan REST API (same-origin proxy `/api/arcscan/token/...`).
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
