'use client';

/**
 * Wire up: `@ledgerhq/device-management-kit`,
 * `@ledgerhq/device-transport-kit-web-hid` (WebHID). Add Clear Signing / DMK here.
 */
import type { Hash, TransactionSerializable } from 'viem';
import { useCallback } from 'react';

export type SignedTransactionResult = { serializedTransaction: Hash };

export function useLedger() {
  const signTransaction = useCallback(
    async (_tx: TransactionSerializable): Promise<SignedTransactionResult> => {
      throw new Error('Ledger DMK not wired');
    },
    [],
  );

  return {
    isLedgerConnected: false as const,
    signTransaction,
  };
}
