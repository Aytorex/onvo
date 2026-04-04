'use client';

import { arcTestnet } from '@/lib/arc-chain';
import { invoiceRegistryContract } from '@/lib/contract';
import { parseWorldIdNullifierToBigInt, useWorldID } from '@/lib/worldid';
import { useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';

export function useEmitterOnChainReady() {
  const { address, isConnected } = useAccount();
  const { nullifier: sessionNullifier } = useWorldID();
  const registryChainId = invoiceRegistryContract.chainId ?? arcTestnet.id;

  const nullifierBn = useMemo(
    () => parseWorldIdNullifierToBigInt(sessionNullifier),
    [sessionNullifier],
  );

  const args = useMemo(() => {
    if (!address || nullifierBn === null) return undefined;
    return [address, nullifierBn] as const;
  }, [address, nullifierBn]);

  const {
    data: worldIdAuthorizedOnChain,
    refetch: refetchEmitterVerified,
    isPending: emitterVerifyPending,
  } = useReadContract({
    chainId: registryChainId,
    address: invoiceRegistryContract.address,
    abi: invoiceRegistryContract.abi,
    functionName: 'isWorldIdAuthorizedForEmitter',
    args,
    query: {
      enabled: Boolean(isConnected && address && nullifierBn !== null),
    },
  });

  const emitterReady =
    isConnected &&
    Boolean(address) &&
    nullifierBn !== null &&
    !emitterVerifyPending &&
    worldIdAuthorizedOnChain === true;

  return {
    address,
    isConnected,
    worldIdAuthorizedOnChain,
    refetchEmitterVerified,
    emitterReady,
    emitterVerifyPending,
  } as const;
}
