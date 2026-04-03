import { ProposalsList } from '@/components/shared/proposals-list';
import { VoteCard } from '@/components/shared/vote-card';
import { WinningProposal } from '@/components/shared/winning-proposal';
import { VoteEventsTable } from '@/components/shared/vote-events-table';

export default function Votes() {
  return (
    <>
      <VoteCard />
      <WinningProposal />
      <ProposalsList />
      <VoteEventsTable />
    </>
  );
}
