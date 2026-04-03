'use client';

import { useEffect } from 'react';
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from 'wagmi';
import { toast as sonner } from 'sonner';
import { useTranslation } from 'react-i18next';

export function useContract(successCallback: () => void) {
  const { i18n } = useTranslation('common');
  const { isConnected } = useAccount();
  const {
    data: writeContractHash,
    status: writeContractStatus,
    writeContract,
  } = useWriteContract();
  const { status: transactionStatus } = useWaitForTransactionReceipt({
    hash: writeContractHash,
  });

  useEffect(() => {
    if (writeContractStatus === 'error' || transactionStatus === 'error') {
      sonner.error(i18n.t('transaction.errorTitle'), {
        description: i18n.t('transaction.errorDescription'),
        position: 'bottom-right',
      });
    } else if (
      writeContractStatus === 'success' &&
      transactionStatus === 'pending'
    ) {
      sonner.info(i18n.t('transaction.pendingTitle'), {
        description: i18n.t('transaction.pendingDescription'),
        position: 'bottom-right',
      });
    } else if (transactionStatus === 'success') {
      sonner.success(i18n.t('transaction.successTitle'), {
        description: i18n.t('transaction.successDescription'),
        position: 'bottom-right',
      });
      successCallback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionStatus, writeContractStatus, i18n]);

  return {
    isConnected: isConnected,
    isPending:
      transactionStatus === 'pending' &&
      !['idle', 'error'].includes(writeContractStatus),
    writeContract,
  };
}
