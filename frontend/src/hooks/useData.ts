'use client';

import { useBallotContractReads } from '@/hooks/ballot/use-ballot-contract-reads';
import { useBallotEvents } from '@/hooks/ballot/use-ballot-events';
import { useBallotProposals } from '@/hooks/ballot/use-ballot-proposals';
import { useBallotVoter } from '@/hooks/ballot/use-ballot-voter';
import { useDataStore } from '@/stores/use-data-store';
import type { DataType } from '@/types/ballot-data';
import { bytesToString } from '@/utils/bytesToString';
import { useAccount } from 'wagmi';
import { useLayoutEffect, useMemo } from 'react';

/** Reads on-chain ballot state via Wagmi and mirrors it into `useDataStore`. */
export function useData(): void {
  const { isConnected, address } = useAccount();
  const { eventLogs, isEventsLoading } = useBallotEvents();

  const {
    chairPerson,
    proposalsCount,
    winnerName,
    winningProposal,
    votersCount,
    refetchWinnerName,
    refetchWinningProposal,
    refetchVotersCount,
  } = useBallotContractReads(address);

  const { account, refetchAccount } = useBallotVoter(address);

  const count =
    proposalsCount !== undefined ? Number(proposalsCount) : undefined;
  const { proposals, isProposalsLoading, refetchProposals } =
    useBallotProposals(address, count);

  const eventLogsCount = eventLogs?.length || 0;
  const votesCount = proposals?.reduce(
    (total, proposal) => total + proposal.voteCount,
    0,
  );

  const snapshot: DataType = useMemo(
    () => ({
      data: {
        account: account
          ? {
              weight: Number(account[0]),
              voted: account[1],
              delegate: String(account?.[2]),
              vote: Number(account[3]),
            }
          : undefined,
        chairPerson,
        eventLogs: eventLogs,
        eventLogsCount,
        proposals,
        proposalsCount: count,
        votesCount,
        votersCount: votersCount ? Number(votersCount) : undefined,
        walletAddress: address,
        winnerName: winnerName ? bytesToString(winnerName) : undefined,
        winningProposal:
          winningProposal !== undefined ? Number(winningProposal) : undefined,
      },
      isConnected: isConnected,
      isProposalsLoading,
      isEventsLoading,
      refetchAccount,
      refetchProposals,
      refetchVotersCount,
      refetchWinnerName,
      refetchWinningProposal,
    }),
    [
      account,
      chairPerson,
      count,
      eventLogs,
      eventLogsCount,
      isConnected,
      isEventsLoading,
      isProposalsLoading,
      proposals,
      refetchAccount,
      refetchProposals,
      refetchVotersCount,
      refetchWinnerName,
      refetchWinningProposal,
      address,
      votersCount,
      winnerName,
      winningProposal,
    ],
  );

  useLayoutEffect(() => {
    useDataStore.setState(snapshot);
  }, [snapshot]);
}
