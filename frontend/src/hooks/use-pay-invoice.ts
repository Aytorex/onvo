'use client';

import { useCallback, useMemo, useState } from 'react';
import { useReadContract } from 'wagmi';

import { refreshPayInvoiceSerialized } from '@/app/pay/[invoiceId]/actions';
import { invoiceRegistryContract } from '@/lib/contract';
import {
  decodeGetInvoiceTuple,
  type SerializedGetInvoiceTuple,
} from '@/lib/pay-invoice/get-invoice-tuple-serialized';
import {
  INVOICE_LOAD_FAILED_ERROR,
  INVOICE_REGISTRY_UNCONFIGURED_ERROR,
  isInvoiceRegistryConfigured,
  normalizeGetInvoiceReadError,
  parseGetInvoiceResult,
  type InvoiceView,
} from '@/lib/pay-invoice';

type RefetchInvoice = () => Promise<unknown>;

type UsePayInvoiceResult =
  | {
      status: 'loading';
      invoice: undefined;
      error: undefined;
      refetch: RefetchInvoice | undefined;
    }
  | {
      status: 'error';
      invoice: undefined;
      error: Error;
      refetch: RefetchInvoice | undefined;
    }
  | {
      status: 'ready';
      invoice: InvoiceView;
      error: undefined;
      refetch: RefetchInvoice | undefined;
    };

export function usePayInvoice(
  invoiceId: bigint,
  options?: Readonly<{ serializedInvoice?: SerializedGetInvoiceTuple }>,
): UsePayInvoiceResult {
  const registryOk = isInvoiceRegistryConfigured();
  const initialSerialized = options?.serializedInvoice;
  const [latestSerialized, setLatestSerialized] =
    useState<SerializedGetInvoiceTuple | null>(null);

  const activeSerialized = latestSerialized ?? initialSerialized;
  const readOnClient = registryOk && initialSerialized === undefined;

  const { data, isPending, isError, error, refetch: wagmiRefetch } = useReadContract({
    address: invoiceRegistryContract.address,
    abi: invoiceRegistryContract.abi,
    functionName: 'getInvoice',
    args: [invoiceId],
    query: {
      enabled: readOnClient,
    },
  });

  const invoiceFromSerialized = useMemo((): InvoiceView | undefined => {
    if (!activeSerialized) {
      return undefined;
    }
    try {
      return parseGetInvoiceResult(
        invoiceId,
        decodeGetInvoiceTuple(activeSerialized),
      );
    } catch {
      return undefined;
    }
  }, [activeSerialized, invoiceId]);

  const refetch = useCallback(async () => {
    if (initialSerialized !== undefined) {
      const r = await refreshPayInvoiceSerialized(invoiceId.toString(10));
      if (r.ok) {
        setLatestSerialized(r.serializedInvoice);
      }
      return;
    }
    await wagmiRefetch();
  }, [initialSerialized, invoiceId, wagmiRefetch]);

  if (!registryOk) {
    return {
      status: 'error',
      invoice: undefined,
      error: new Error(INVOICE_REGISTRY_UNCONFIGURED_ERROR),
      refetch: undefined,
    };
  }

  if (initialSerialized !== undefined) {
    if (!invoiceFromSerialized) {
      return {
        status: 'error',
        invoice: undefined,
        error: new Error(INVOICE_LOAD_FAILED_ERROR),
        refetch,
      };
    }
    return {
      status: 'ready',
      invoice: invoiceFromSerialized,
      error: undefined,
      refetch,
    };
  }

  if (isPending) {
    return {
      status: 'loading',
      invoice: undefined,
      error: undefined,
      refetch,
    };
  }

  if (isError && error) {
    return {
      status: 'error',
      invoice: undefined,
      error: normalizeGetInvoiceReadError(error),
      refetch,
    };
  }

  if (data !== undefined && data !== null) {
    try {
      return {
        status: 'ready',
        invoice: parseGetInvoiceResult(invoiceId, data),
        error: undefined,
        refetch,
      };
    } catch {
      return {
        status: 'error',
        invoice: undefined,
        error: new Error(INVOICE_LOAD_FAILED_ERROR),
        refetch,
      };
    }
  }

  return {
    status: 'error',
    invoice: undefined,
    error: new Error(INVOICE_LOAD_FAILED_ERROR),
    refetch,
  };
}
