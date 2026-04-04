export const INVOICE_STATUS = {
  Pending: 0,
  Paid: 1,
  Cancelled: 2,
} as const;

export type InvoiceStatus =
  (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];

export type InvoiceStatusI18nKey = 'pending' | 'paid' | 'cancelled';

export type InvoiceView = {
  invoiceId: bigint;
  invoiceHash: `0x${string}`;
  emitter: `0x${string}`;
  recipient: `0x${string}`;
  amount: bigint;
  token: `0x${string}`;
  status: InvoiceStatus;
  vatNumber: string;
  issuerWorldId: string;
};

export function invoiceStatusI18nKey(
  status: InvoiceStatus,
): InvoiceStatusI18nKey {
  if (status === INVOICE_STATUS.Paid) {
    return 'paid';
  }
  if (status === INVOICE_STATUS.Cancelled) {
    return 'cancelled';
  }
  return 'pending';
}
