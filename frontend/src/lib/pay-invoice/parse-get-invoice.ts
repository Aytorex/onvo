import {
  getAddress,
  isAddress,
  isAddressEqual,
  isHex,
  zeroAddress,
  type Hex,
} from 'viem';

import { INVOICE_STATUS, type InvoiceStatus, type InvoiceView } from './types';

/** Matches `InvoiceRegistry.getInvoice` return tuple order (see `contract.ts` ABI). */
const GET_INVOICE_FIELD_COUNT = 8;

function requireTuple(data: unknown): unknown[] {
  if (!Array.isArray(data) || data.length !== GET_INVOICE_FIELD_COUNT) {
    throw new TypeError(
      `getInvoice: expected ${GET_INVOICE_FIELD_COUNT} fields`,
    );
  }
  return data;
}

function assertBytes32InvoiceHash(value: unknown): Hex {
  if (
    typeof value !== 'string' ||
    !isHex(value, { strict: true }) ||
    value.length !== 66
  ) {
    throw new TypeError('getInvoice: invalid invoiceHash');
  }
  return value;
}

function assertAddress(value: unknown, label: string): `0x${string}` {
  if (typeof value !== 'string' || !isAddress(value)) {
    throw new TypeError(`getInvoice: invalid ${label}`);
  }
  return getAddress(value);
}

function coerceUint256(value: unknown): bigint {
  if (typeof value === 'bigint') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    return BigInt(value);
  }
  throw new TypeError('getInvoice: invalid amount');
}

function worldIdNullifierToIssuerDisplay(raw: unknown): string {
  if (typeof raw === 'bigint') {
    return raw === 0n ? '' : raw.toString(10);
  }
  if (typeof raw === 'string' && /^-?\d+$/.test(raw)) {
    return BigInt(raw) === 0n ? '' : raw;
  }
  if (typeof raw === 'string' && isAddress(raw)) {
    const a = getAddress(raw);
    return isAddressEqual(a, zeroAddress) ? '' : a;
  }
  throw new TypeError('getInvoice: invalid worldId nullifier');
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

  if (!Number.isInteger(n)) {
    throw new TypeError('getInvoice: invalid status');
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
  throw new TypeError('getInvoice: invalid status');
}

export function parseGetInvoiceResult(
  invoiceId: bigint,
  data: unknown,
): InvoiceView {
  const row = requireTuple(data);

  const invoiceHash = assertBytes32InvoiceHash(row[0]);
  const emitter = assertAddress(row[1], 'emitter');
  const recipient = assertAddress(row[2], 'recipient');
  const amount = coerceUint256(row[3]);
  const token = assertAddress(row[4], 'token');
  const vatNumber = row[5];

  if (typeof vatNumber !== 'string') {
    throw new TypeError('getInvoice: invalid vatNumber');
  }

  const issuerWorldId = worldIdNullifierToIssuerDisplay(row[6]);
  const status = normalizeInvoiceStatus(row[7]);

  return {
    invoiceId,
    invoiceHash,
    emitter,
    recipient,
    amount,
    token,
    status,
    vatNumber,
    issuerWorldId,
  };
}
