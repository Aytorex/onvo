/** Deep link used by World App to open a profile for a wallet address (@worldcoin/minikit-js). */
export function worldAppProfileDeepLink(address: string): string {
  return `worldapp://profile?address=${encodeURIComponent(address)}`;
}

export function shortIssuerAddress(address: string): string {
  if (address.length < 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
