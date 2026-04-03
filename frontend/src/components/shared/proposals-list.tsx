'use client';

import { useDataStore } from '@/stores/use-data-store';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '../ui/skeleton';
import { useTranslation } from 'react-i18next';

export function ProposalsList({
  displayVotes = true,
}: {
  displayVotes?: boolean;
}) {
  const { t } = useTranslation('common');
  const proposals = useDataStore((s) => s.data.proposals);

  return (
    <Card>
      <CardHeader className="bg-muted/50">
        <CardTitle>{t('proposalsList.title')}</CardTitle>
        <CardDescription>{t('proposalsList.description')}</CardDescription>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="max-w-1">{t('proposalsList.id')}</TableHead>
            <TableHead>{t('proposalsList.name')}</TableHead>
            {displayVotes && (
              <TableHead className="max-w-1 text-right">
                {t('proposalsList.voteCount')}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {!proposals
            ? [...new Array(3)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-1/2" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-2/3" />
                  </TableCell>
                  {displayVotes && (
                    <TableCell className="flex place-content-end">
                      <Skeleton className="h-4 w-1/2" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            : proposals?.map((proposal, index) => (
                <TableRow key={index}>
                  <TableCell>{index}</TableCell>
                  <TableCell>{proposal.name}</TableCell>
                  {displayVotes && (
                    <TableCell className="text-right">
                      {proposal.voteCount}
                    </TableCell>
                  )}
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </Card>
  );
}
