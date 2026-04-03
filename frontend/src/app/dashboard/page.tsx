import { AccountInfo } from '@/components/shared/account-info';
import { ChairPerson } from '@/components/shared/chair-person';
import { ProposalsList } from '@/components/shared/proposals-list';
import { VotersCountCard } from '@/components/shared/voters-count-card';
import { WinningProposal } from '@/components/shared/winning-proposal';

export default function Dashboard() {
  return (
    <>
      <AccountInfo />
      <ChairPerson />
      <VotersCountCard />
      <WinningProposal />
      <ProposalsList />
    </>
  );
}
