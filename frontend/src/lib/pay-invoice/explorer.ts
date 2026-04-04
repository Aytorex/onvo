export function explorerTxUrl(txHash: string): string | null {
  const base = process.env.NEXT_PUBLIC_CHAIN_EXPLORER_URL?.replace(/\/$/, '');
  if (!base) {
    return null;
  }
  return `${base}/tx/${txHash}`;
}
