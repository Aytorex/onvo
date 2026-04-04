import { getAddress, isAddress, isHex } from 'viem';

import { INVOICE_STATUS, type InvoiceStatus, type InvoiceView } from './types';

function formatUnknown(value: unknown): string {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[object]';
    }
  }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'symbol'
  ) {
    return String(value);
  }
  return '[unknown]';
}

function toBigIntStrict(value: unknown): bigint {
  if (typeof value === 'bigint') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    return BigInt(value);
  }
  throw new TypeError('getInvoice: invalid amount type');
}

export function normalizeInvoiceStatus(value: unknown): InvoiceStatus {
  let n: number;
  if (typeof value === 'bigint') {
    n = Number(value);
  } else if (typeof value === 'number') {
    n = value;
  } else {
    n = Number(value);
  }
  if (!Number.isFinite(n)) {
    throw new TypeError(`getInvoice: invalid status ${formatUnknown(value)}`);
  }
  if (n === INVOICE_STATUS.Pending) {
    return INVOICE_STATUS.Pending;
  }
  if (n === INVOICE_STATUS.Paid) {
    return INVOICE_STATUS.Paid;
  }
  if (n === INVOICE_STATUS.Cancelled) {
    return INVOICE_STATUS.Cancelled;
  }
  throw new TypeError(`getInvoice: invalid status ${formatUnknown(value)}`);
}

export function parseGetInvoiceResult(
  invoiceId: bigint,
  data: unknown,
): InvoiceView {
  if (!Array.isArray(data) || data.length !== 6) {
    throw new TypeError('getInvoice: expected tuple of length 6');
  }

  const [
    invoiceHashRaw,
    emitterRaw,
    recipientRaw,
    amountRaw,
    tokenRaw,
    statusRaw,
  ] = data;

  if (
    typeof invoiceHashRaw !== 'string' ||
    !isHex(invoiceHashRaw, { strict: true }) ||
    invoiceHashRaw.length !== 66
  ) {
    throw new TypeError('getInvoice: invalid invoiceHash');
  }

  if (
    !isAddress(emitterRaw) ||
    !isAddress(recipientRaw) ||
    !isAddress(tokenRaw)
  ) {
    throw new TypeError('getInvoice: invalid address field');
  }

  const amount = toBigIntStrict(amountRaw);
  const status = normalizeInvoiceStatus(statusRaw);

  return {
    invoiceId,
    invoiceHash: invoiceHashRaw,
    emitter: getAddress(emitterRaw),
    recipient: getAddress(recipientRaw),
    amount,
    token: getAddress(tokenRaw),
    status,
  };
}
