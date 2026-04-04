/** Matches `InvoiceRegistry.COMMISSION_BPS_DENOMINATOR` (100% = 10_000 bps). */
export const COMMISSION_BPS_DENOMINATOR = 10_000n;

/** Commission in token wei for a gross invoice `amount` at `commissionBps`. */
export function commissionWeiFromGross(
  gross: bigint,
  commissionBps: bigint,
): bigint {
  return (gross * commissionBps) / COMMISSION_BPS_DENOMINATOR;
}

export function emitterNetWei(gross: bigint, commissionBps: bigint): bigint {
  return gross - commissionWeiFromGross(gross, commissionBps);
}

/** Human-readable percent for UI, e.g. 10 bps → "0.1" (percent points). */
export function formatCommissionPercentString(commissionBps: bigint): string {
  const n = Number(commissionBps);
  if (!Number.isSafeInteger(n)) return `${commissionBps.toString()} bps`;
  return (n / 100).toString();
}
