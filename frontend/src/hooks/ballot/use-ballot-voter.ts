'use client';

import { ballotContract } from '@/contracts/ballot.contract';
import { useReadContract } from 'wagmi';

export function useBallotVoter(address: `0x${string}` | undefined) {
  const { data: account, refetch: refetchAccount } = useReadContract({
    ...ballotContract,
    account: address,
    functionName: 'voters',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  return { account, refetchAccount };
}
