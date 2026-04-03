'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ballotContract } from '@/contracts/ballot.contract';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useContract } from '@/hooks/useContract';
import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useDataStore } from '@/stores/use-data-store';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';

export function DelegateCard() {
  const { t } = useTranslation('common');
  const [delegateAddress, setDelegateAddress] = useState<string>('');
  const { data, refetchAccount } = useDataStore(
    useShallow((s) => ({ data: s.data, refetchAccount: s.refetchAccount })),
  );
  const { isConnected, isPending, writeContract } = useContract(() => {
    setDelegateAddress('');
    refetchAccount();
  });

  if (!data.account || data.account.weight === 0) {
    return null;
  }

  function submitDelegate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    writeContract({
      ...ballotContract,
      functionName: 'delegate',
      args: [delegateAddress as `0x${string}`],
    });
  }

  return (
    <Card>
      <CardHeader className="bg-muted/50">
        <CardTitle>{t('delegate.title')}</CardTitle>
        <CardDescription>{t('delegate.description')}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {data.account.voted ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              {t('delegate.cannotDelegate')}
            </p>
          </div>
        ) : (
          <form className="flex-row gap-6" onSubmit={submitDelegate}>
            <div className="grid gap-3">
              <Label htmlFor="delegate_address">{t('delegate.address')}</Label>
              <div className="flex gap-2">
                <Input
                  className="w-full"
                  disabled={isPending || !isConnected}
                  id="delegate_address"
                  maxLength={42}
                  minLength={42}
                  onChange={(event) =>
                    setDelegateAddress(event.currentTarget.value)
                  }
                  placeholder={t('delegate.placeholder')}
                  required={true}
                  type="text"
                  value={delegateAddress}
                />
                <Button
                  className="min-w-32"
                  disabled={isPending || !isConnected || !delegateAddress}
                  type="submit"
                >
                  {isPending ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <>{t('delegate.submit')}</>
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
