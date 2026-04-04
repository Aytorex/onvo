'use client';

import { useCallback } from 'react';
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';
import { erc20Abi } from 'viem';
import { arcTestnet } from 'viem/chains';

import { invoiceRegistryContract } from '@/lib/contract';
import { switchWalletToArcTestnet } from '@/lib/arc-chain';
import type { InvoiceView } from '@/lib/pay-invoice';

export type WalletPaymentStep = 'idle' | 'approving' | 'paying';

export function useInvoicePayment() {
  const { address } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const registryChainId = invoiceRegistryContract.chainId ?? arcTestnet.id;
  const publicClient = usePublicClient({ chainId: registryChainId });

  const payWithInjectedWallet = useCallback(
    async (
      invoice: InvoiceView,
      onStep?: (step: WalletPaymentStep) => void,
    ): Promise<`0x${string}`> => {
      if (!address) {
        throw new Error('Wallet not connected');
      }
      if (!publicClient) {
        throw new Error('No public client for Arc');
      }

      await switchWalletToArcTestnet(switchChainAsync);

      const registry = invoiceRegistryContract.address;
      const token = invoice.token;
      const amount = invoice.amount;

      const allowance = await publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, registry],
      });

      if (allowance < amount) {
        onStep?.('approving');
        const approveHash = await writeContractAsync({
          address: token,
          abi: erc20Abi,
          functionName: 'approve',
          args: [registry, amount],
          chainId: registryChainId,
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      onStep?.('paying');
      const payHash = await writeContractAsync({
        address: registry,
        abi: invoiceRegistryContract.abi,
        functionName: 'payInvoice',
        args: [invoice.invoiceId],
        chainId: registryChainId,
      });
      await publicClient.waitForTransactionReceipt({ hash: payHash });
      return payHash;
    },
    [address, publicClient, switchChainAsync, writeContractAsync],
  );

  return { payWithInjectedWallet, registryChainId, address };
}
