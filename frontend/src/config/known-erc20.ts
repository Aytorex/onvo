/**
 * Static ERC-20 metadata for display when the app does not call the chain for symbol/decimals.
 * Keys must be lowercase `0x` addresses. Add Arc Testnet token addresses when known.
 */
export const DEFAULT_ERC20_DECIMALS = 6;

export const KNOWN_ERC20_BY_ADDRESS: Record<
  string,
  { symbol: string; decimals: number }
> = {
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', decimals: 6 },
};
