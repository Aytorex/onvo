'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useDataStore } from '@/stores/use-data-store';
import { useShallow } from 'zustand/react/shallow';
import { Badge } from '@/components/ui/badge';
import {
  BookMarked,
  Vote,
  HandHelping,
  ScrollText,
  Weight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';

const ADDRESS_0 = '0x0000000000000000000000000000000000000000';

export function AccountInfo() {
  const { t } = useTranslation('common');
  const { account, proposals, isConnected } = useDataStore(
    useShallow((s) => ({
      account: s.data.account,
      proposals: s.data.proposals,
      isConnected: s.isConnected,
    })),
  );

  if (!isConnected) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="bg-muted/50">
        <CardTitle>{t('account.title')}</CardTitle>
        <CardDescription>{t('account.description')}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-3">
          <dl className="grid gap-3">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1 text-muted-foreground">
                <BookMarked className="h-5 w-5 mr-2" />
                {t('account.registrationStatus')}
              </dt>
              <dd>
                {!account ? (
                  <Skeleton className="h-6 w-20 rounded-full" />
                ) : account.weight > 0 ? (
                  <Badge className="h-6 bg-green-700 hover:bg-green-800">
                    {t('account.registered')}
                  </Badge>
                ) : (
                  <Badge className="h-6" variant="destructive">
                    {t('account.notRegistered')}
                  </Badge>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1 text-muted-foreground">
                <Vote className="h-5 w-5 mr-2" />
                {t('account.hasVoted')}
              </dt>
              <dd>
                {!account ? (
                  <Skeleton className="h-6 w-20 rounded-full" />
                ) : account.voted ? (
                  <Badge className="h-6 bg-green-700 hover:bg-green-800">
                    {t('account.yes')}
                  </Badge>
                ) : (
                  <Badge className="h-6" variant="secondary">
                    {t('account.no')}
                  </Badge>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1 text-muted-foreground">
                <Weight className="h-5 w-5 mr-2" />
                {t('account.voteWeight')}
              </dt>
              <dd>
                {!account ? (
                  <Skeleton className="h-6 w-20 rounded-full" />
                ) : (
                  <Badge className="h-6" variant="secondary">
                    {account.weight}
                  </Badge>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1 text-muted-foreground">
                <HandHelping className="h-5 w-5 mr-2" />
                {t('account.delegation')}
              </dt>
              <dd>
                {!account ? (
                  <Skeleton className="h-6 w-48 rounded-full" />
                ) : account.delegate !== ADDRESS_0 ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge className="h-6 bg-green-700 hover:bg-green-800">
                          {`${account.delegate.slice(0, 6)}...${account.delegate.slice(-4)}`}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>{account.delegate}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Badge className="h-6" variant="secondary">
                    {t('account.no')}
                  </Badge>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1 text-muted-foreground">
                <ScrollText className="h-5 w-5 mr-2" />
                {t('account.voteProposal')}
              </dt>
              <dd>
                {!account || !proposals ? (
                  <Skeleton className="h-6 w-48 rounded-full" />
                ) : proposals &&
                  account.voted &&
                  account.delegate === ADDRESS_0 &&
                  proposals[account.vote] ? (
                  <>{proposals[account.vote].name}</>
                ) : (
                  <Badge className="h-6" variant="secondary">
                    ---
                  </Badge>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
