'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { useDataStore } from '@/stores/use-data-store';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

export function WinningProposal() {
  const { t } = useTranslation('common');
  const winnerName = useDataStore((s) => s.data.winnerName);

  return (
    <Card>
      <CardHeader className="bg-muted/50">
        <CardTitle className="text-2xl font-semibold leading-none tracking-tight">
          {t('winningProposal.title')}
        </CardTitle>
        <CardDescription>{t('winningProposal.description')}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-3">
          <dl className="grid gap-3">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1 text-muted-foreground">
                <Trophy className="h-5 w-5 mr-2" />
                {t('winningProposal.proposal')}
              </dt>
              <dd>
                {!winnerName ? (
                  <Skeleton className="h-6 w-48 rounded-full" />
                ) : (
                  winnerName
                )}
              </dd>
            </div>
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
