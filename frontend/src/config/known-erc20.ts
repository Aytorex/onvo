/**
 * Sync ERC-20 symbol/decimals for code paths that cannot await ArcScan (e.g. `formatUnits` in
 * `formatInvoiceAmount`). UI surfaces that can load ArcScan should prefer explorer metadata there.
 *
 * `format.getTokenMeta` lit uniquement cette table ; les adresses Arc viennent des mêmes constantes
 * que `getTokenAddress` dans `invoice-tokens.ts`.
 */
import {
  ARC_TESTNET_EURC_DEFAULT,
  ARC_TESTNET_USDC_DEFAULT,
} from '@/lib/invoice-tokens';

export const DEFAULT_ERC20_DECIMALS = 6;

export const KNOWN_ERC20_BY_ADDRESS: Record<
  string,
  { symbol: string; decimals: number }
> = {
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', decimals: 6 },
  [ARC_TESTNET_USDC_DEFAULT.toLowerCase()]: {
    symbol: 'USDC',
    decimals: DEFAULT_ERC20_DECIMALS,
  },
  [ARC_TESTNET_EURC_DEFAULT.toLowerCase()]: {
    symbol: 'EURC',
    decimals: DEFAULT_ERC20_DECIMALS,
  },
};
