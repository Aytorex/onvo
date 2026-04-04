import type { StableCurrency } from '@/lib/invoice-types';

/** Arc Testnet (5042002) — aligné backend `InvoiceRegistry.prod.ts` / docs Arc. */
export const ARC_TESTNET_USDC_DEFAULT =
  '0x3600000000000000000000000000000000000000' as const;
export const ARC_TESTNET_EURC_DEFAULT =
  '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' as const;

/**
 * Adresses des stablecoins. Par défaut : Arc Testnet ci-dessus.
 * `NEXT_PUBLIC_TOKEN_USDC` / `NEXT_PUBLIC_TOKEN_EURC` surchargent si besoin.
 */
export function getTokenAddress(currency: StableCurrency): `0x${string}` {
  const usdc =
    process.env.NEXT_PUBLIC_TOKEN_USDC?.trim() || ARC_TESTNET_USDC_DEFAULT;
  const eurc =
    process.env.NEXT_PUBLIC_TOKEN_EURC?.trim() || ARC_TESTNET_EURC_DEFAULT;
  return currency === 'USDC'
    ? (usdc as `0x${string}`)
    : (eurc as `0x${string}`);
}

export function tokenDecimals(): 6 {
  return 6;
}
