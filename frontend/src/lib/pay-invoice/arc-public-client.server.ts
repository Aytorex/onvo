import 'server-only';

import { createPublicClient, http } from 'viem';
import { arcTestnet } from 'viem/chains';

/** Arc Testnet JSON-RPC for server-side `readContract` (same env as `wagmi.config`). */
export function getArcPublicClientForPay() {
  const base = process.env.ALCHEMY_ENDPOINT_URL_ARC_TESTNET ?? '';
  const key = process.env.ALCHEMY_API_KEY ?? '';
  const url = base && key ? `${base}${key}` : undefined;
  if (!url) {
    return null;
  }
  return createPublicClient({
    chain: arcTestnet,
    transport: http(url),
  });
}
