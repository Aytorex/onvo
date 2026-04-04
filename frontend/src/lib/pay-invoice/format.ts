import { formatUnits } from 'viem';

import {
  DEFAULT_ERC20_DECIMALS,
  KNOWN_ERC20_BY_ADDRESS,
} from '@/config/known-erc20';

export function shortAddress(addr: string, chars = 4): string {
  if (!addr || addr.length < 2 + chars * 2) {
    return addr;
  }
  return `${addr.slice(0, 2 + chars)}…${addr.slice(-chars)}`;
}

export function getTokenMeta(token: `0x${string}`): {
  symbol: string;
  decimals: number;
} {
  const key = token.toLowerCase();
  const known = KNOWN_ERC20_BY_ADDRESS[key];
  if (known) {
    return known;
  }
  return {
    symbol: shortAddress(token),
    decimals: DEFAULT_ERC20_DECIMALS,
  };
}

export function formatInvoiceAmount(
  amount: bigint,
  token: `0x${string}`,
): { formatted: string; symbol: string } {
  const { symbol, decimals } = getTokenMeta(token);
  return {
    formatted: formatUnits(amount, decimals),
    symbol,
  };
}
