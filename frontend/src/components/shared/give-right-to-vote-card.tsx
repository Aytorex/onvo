'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ballotContract } from '@/contracts/ballot.contract';
import { useContract } from '@/hooks/useContract';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { useDataStore } from '@/stores/use-data-store';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';

export function GiveRightToVoteCard() {
  const { t } = useTranslation('common');
  const [giveRightAddress, setGiveRightAddress] = useState<string>('');
  const { chairPerson, walletAddress, refetchVotersCount } = useDataStore(
    useShallow((s) => ({
      chairPerson: s.data.chairPerson,
      walletAddress: s.data.walletAddress,
      refetchVotersCount: s.refetchVotersCount,
    })),
  );
  const { isConnected, isPending, writeContract } = useContract(() => {
    setGiveRightAddress('');
    refetchVotersCount();
  });

  function submitGiveRights(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    writeContract({
      ...ballotContract,
      functionName: 'giveRightToVote',
      args: [giveRightAddress as `0x${string}`],
    });
  }

  if (!chairPerson || !walletAddress || chairPerson !== walletAddress) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="bg-muted/50">
        <CardTitle>{t('giveRight.title')}</CardTitle>
        <CardDescription>{t('giveRight.description')}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form className="flex-row gap-6" onSubmit={submitGiveRights}>
          <div className="grid gap-3">
            <Label htmlFor="give_right_address">{t('giveRight.address')}</Label>
            <div className="flex gap-2">
              <Input
                className="w-full"
                disabled={isPending || !isConnected}
                id="give_right_address"
                maxLength={42}
                minLength={42}
                onChange={(event) =>
                  setGiveRightAddress(event.currentTarget.value)
                }
                placeholder={t('giveRight.placeholder')}
                required={true}
                type="text"
                value={giveRightAddress}
              />
              <Button
                className="min-w-32"
                disabled={isPending || !isConnected}
                type="submit"
              >
                {isPending ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <>{t('giveRight.submit')}</>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
