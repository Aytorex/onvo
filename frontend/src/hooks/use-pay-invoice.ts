'use client';

import { useReadContract } from 'wagmi';

import { invoiceRegistryContract } from '@/lib/contract';
import {
  getMockInvoice,
  isInvoiceRegistryConfigured,
  parseGetInvoiceResult,
  type InvoiceView,
} from '@/lib/pay-invoice';

type UsePayInvoiceResult =
  | {
      status: 'loading';
      invoice: undefined;
      isMock: boolean;
      error: undefined;
    }
  | {
      status: 'error';
      invoice: undefined;
      isMock: false;
      error: Error;
    }
  | {
      status: 'ready';
      invoice: InvoiceView;
      isMock: boolean;
      error: undefined;
    };

export function usePayInvoice(invoiceId: bigint): UsePayInvoiceResult {
  const registryOk = isInvoiceRegistryConfigured();

  const { data, isPending, isError, error } = useReadContract({
    address: invoiceRegistryContract.address,
    abi: invoiceRegistryContract.abi,
    functionName: 'getInvoice',
    args: [invoiceId],
    query: {
      enabled: registryOk,
    },
  });

  if (!registryOk) {
    return {
      status: 'ready',
      invoice: getMockInvoice(invoiceId),
      isMock: true,
      error: undefined,
    };
  }

  if (isPending) {
    return {
      status: 'loading',
      invoice: undefined,
      isMock: false,
      error: undefined,
    };
  }

  if (isError && error) {
    return {
      status: 'error',
      invoice: undefined,
      isMock: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  if (data !== undefined && data !== null) {
    try {
      return {
        status: 'ready',
        invoice: parseGetInvoiceResult(invoiceId, data),
        isMock: false,
        error: undefined,
      };
    } catch (e) {
      return {
        status: 'error',
        invoice: undefined,
        isMock: false,
        error: e instanceof Error ? e : new Error(String(e)),
      };
    }
  }

  return {
    status: 'error',
    invoice: undefined,
    isMock: false,
    error: new Error('getInvoice returned no data'),
  };
}
