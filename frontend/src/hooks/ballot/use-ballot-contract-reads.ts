'use client';

import { ballotContract } from '@/contracts/ballot.contract';
import { useReadContract } from 'wagmi';

export function useBallotContractReads(address: `0x${string}` | undefined) {
  const { data: chairPerson } = useReadContract({
    ...ballotContract,
    account: address,
    functionName: 'chairperson',
  });

  const { data: proposalsCount } = useReadContract({
    ...ballotContract,
    account: address,
    functionName: 'proposalsCount',
  });

  const { data: winnerName, refetch: refetchWinnerName } = useReadContract({
    ...ballotContract,
    account: address,
    functionName: 'winnerName',
  });

  const { data: winningProposal, refetch: refetchWinningProposal } =
    useReadContract({
      ...ballotContract,
      account: address,
      functionName: 'winningProposal',
    });

  const { data: votersCount, refetch: refetchVotersCount } = useReadContract({
    ...ballotContract,
    account: address,
    functionName: 'votersCount',
  });

  return {
    chairPerson,
    proposalsCount,
    winnerName,
    winningProposal,
    votersCount,
    refetchWinnerName,
    refetchWinningProposal,
    refetchVotersCount,
  };
}
