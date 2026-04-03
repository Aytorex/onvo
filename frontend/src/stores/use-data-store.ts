import type { DataType } from '@/types/ballot-data';
import { create } from 'zustand';

const noop = () => undefined;

const initialState: DataType = {
  data: {
    account: undefined,
    chairPerson: undefined,
    eventLogs: undefined,
    eventLogsCount: undefined,
    proposals: undefined,
    proposalsCount: undefined,
    votesCount: undefined,
    votersCount: undefined,
    walletAddress: undefined,
    winnerName: undefined,
    winningProposal: undefined,
  },
  isConnected: false,
  isProposalsLoading: false,
  isEventsLoading: false,
  refetchAccount: noop,
  refetchProposals: noop,
  refetchVotersCount: noop,
  refetchWinnerName: noop,
  refetchWinningProposal: noop,
};

export const useDataStore = create<DataType>(() => ({ ...initialState }));
