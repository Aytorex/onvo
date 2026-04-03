'use client';

import type { EventLog } from '@/types/ballot-data';
import { ballotContract } from '@/contracts/ballot.contract';
import { useEffect, useState } from 'react';
import { useWatchContractEvent } from 'wagmi';

export function useBallotEvents() {
  const [eventLogs, setEventLogs] = useState<EventLog[] | undefined>(undefined);
  const [isEventsLoading, setIsEventsLoading] = useState(true);

  useWatchContractEvent({
    ...ballotContract,
    fromBlock: ballotContract.fromBlock,
    onLogs: (logs) => {
      setEventLogs(logs as EventLog[]);
      setIsEventsLoading(false);
    },
    onError: () => {
      setEventLogs([]);
      setIsEventsLoading(false);
    },
    poll: true,
    pollingInterval: 10_000,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEventsLoading(false);
    }, 10_000);

    return () => clearTimeout(timer);
  }, []);

  return { eventLogs, isEventsLoading };
}
