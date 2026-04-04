import type { StableCurrency } from '@/lib/invoice-types';

const ZERO = '0x0000000000000000000000000000000000000000' as const;

/** Set `NEXT_PUBLIC_TOKEN_USDC` / `NEXT_PUBLIC_TOKEN_EURC` to Arc Testnet token addresses. */
export function getTokenAddress(currency: StableCurrency): `0x${string}` {
  const usdc =
    process.env.NEXT_PUBLIC_TOKEN_USDC?.trim() || (ZERO as `0x${string}`);
  const eurc =
    process.env.NEXT_PUBLIC_TOKEN_EURC?.trim() || (ZERO as `0x${string}`);
  return currency === 'USDC'
    ? (usdc as `0x${string}`)
    : (eurc as `0x${string}`);
}

export function tokenDecimals(): 6 {
  return 6;
}
