import type { Log } from 'viem';

export type EventType = 'GiveRight' | 'Delegate' | 'Vote';

export type EventLog = Log & {
  args: Record<string, unknown>;
  eventName: EventType;
};

export interface DataType {
  data: {
    account:
      | { weight: number; voted: boolean; delegate: string; vote: number }
      | undefined;
    chairPerson: string | undefined;
    eventLogs: EventLog[] | undefined;
    eventLogsCount: number | undefined;
    proposals: { name: string; voteCount: number }[] | undefined;
    proposalsCount: number | undefined;
    votesCount: number | undefined;
    votersCount: number | undefined;
    walletAddress: `0x${string}` | undefined;
    winnerName: string | undefined;
    winningProposal: number | undefined;
  };
  isConnected: boolean;
  isProposalsLoading: boolean;
  isEventsLoading: boolean;
  refetchAccount: () => void;
  refetchProposals: () => void;
  refetchVotersCount: () => void;
  refetchWinnerName: () => void;
  refetchWinningProposal: () => void;
}
