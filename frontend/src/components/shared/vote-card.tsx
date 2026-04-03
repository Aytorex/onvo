'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ballotContract } from '@/contracts/ballot.contract';
import { useContract } from '@/hooks/useContract';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { useDataStore } from '@/stores/use-data-store';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';

export function VoteCard() {
  const { t } = useTranslation('common');
  const {
    data,
    refetchAccount,
    refetchProposals,
    refetchWinnerName,
    refetchWinningProposal,
  } = useDataStore(
    useShallow((s) => ({
      data: s.data,
      refetchAccount: s.refetchAccount,
      refetchProposals: s.refetchProposals,
      refetchWinnerName: s.refetchWinnerName,
      refetchWinningProposal: s.refetchWinningProposal,
    })),
  );
  const [proposalId, setProposalId] = useState<string | undefined>(undefined);
  const { isConnected, isPending, writeContract } = useContract(() => {
    setProposalId('');
    refetchAccount();
    refetchWinnerName();
    refetchWinningProposal();
    refetchProposals();
  });

  if (!data.account || data.account.weight === 0) {
    return null;
  }

  function submitVote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    writeContract({
      ...ballotContract,
      functionName: 'vote',
      args: [BigInt(Number(proposalId))],
    });
  }

  return (
    <Card>
      <CardHeader className="bg-muted/50">
        <CardTitle>{t('voteCard.title')}</CardTitle>
        <CardDescription>{t('voteCard.description')}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {data.account.voted ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              {t('voteCard.alreadyVoted')}
            </p>
          </div>
        ) : (
          <form className="flex-row gap-6" onSubmit={submitVote}>
            <div className="grid gap-3">
              <Label htmlFor="vote_proposal">
                {t('voteCard.proposalLabel')}
              </Label>
              <div className="flex gap-2">
                <Select
                  required={true}
                  value={proposalId}
                  onValueChange={(value) => setProposalId(value)}
                >
                  <SelectTrigger
                    className="w-full"
                    id="vote_proposal"
                    disabled={isPending || !isConnected}
                  >
                    <SelectValue
                      placeholder={t('voteCard.selectPlaceholder')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {data.proposals &&
                      data.proposals.map((proposal, index) => (
                        <SelectItem key={index} value={String(index)}>
                          {proposal.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  className="min-w-32"
                  disabled={isPending || !isConnected || !proposalId}
                  type="submit"
                >
                  {isPending ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <>{t('voteCard.submit')}</>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
