'use client';

import { arcTestnet } from '@/lib/arc-chain';
import { invoiceRegistryContract } from '@/lib/contract';
import { useAccount, useReadContract } from 'wagmi';

export function useEmitterOnChainReady() {
  const { address, isConnected } = useAccount();
  const registryChainId = invoiceRegistryContract.chainId ?? arcTestnet.id;

  const {
    data: emitterVerified,
    refetch: refetchEmitterVerified,
    isPending: emitterVerifyPending,
  } = useReadContract({
    chainId: registryChainId,
    address: invoiceRegistryContract.address,
    abi: invoiceRegistryContract.abi,
    functionName: 'isEmitterVerified',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && isConnected) },
  });

  const emitterReady =
    isConnected &&
    Boolean(address) &&
    !emitterVerifyPending &&
    emitterVerified === true;

  return {
    address,
    isConnected,
    emitterVerified,
    refetchEmitterVerified,
    emitterReady,
    emitterVerifyPending,
  } as const;
}
