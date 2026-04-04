import type { StableCurrency } from '@/lib/invoice-types';

/** Arc Testnet (5042002) — aligné backend `InvoiceRegistry.prod.ts` / docs Arc. */
export const ARC_TESTNET_USDC_DEFAULT =
  '0x3600000000000000000000000000000000000000' as const;
export const ARC_TESTNET_EURC_DEFAULT =
  '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' as const;

/** Adresses stables Arc Testnet (alignées `InvoiceRegistry` / `allowedTokens`). */
export function getTokenAddress(currency: StableCurrency): `0x${string}` {
  return currency === 'USDC'
    ? ARC_TESTNET_USDC_DEFAULT
    : ARC_TESTNET_EURC_DEFAULT;
}

export function tokenDecimals(): 6 {
  return 6;
}
