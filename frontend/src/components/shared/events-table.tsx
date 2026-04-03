'use client';

import type { EventLog, EventType } from '@/types/ballot-data';
import { useDataStore } from '@/stores/use-data-store';
import { useShallow } from 'zustand/react/shallow';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

interface EventsTableProps {
  title?: string;
  description?: string;
  eventTypes?: EventType[];
  maxEvents?: number;
}

export function EventsTable({
  title,
  description,
  eventTypes = ['GiveRight', 'Delegate', 'Vote'],
  maxEvents = 5,
}: EventsTableProps) {
  const { t } = useTranslation('common');
  const resolvedTitle = title ?? t('eventsTable.recentTitle');
  const resolvedDescription = description ?? t('eventsTable.recentDescription');

  const { eventLogs, isEventsLoading } = useDataStore(
    useShallow((s) => ({
      eventLogs: s.data.eventLogs,
      isEventsLoading: s.isEventsLoading,
    })),
  );

  const filteredEvents =
    eventLogs?.filter((event) => eventTypes.includes(event.eventName)) || [];

  const lastEvents = filteredEvents.slice(-maxEvents).reverse();

  function formatAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function formatEventDetails(event: EventLog) {
    switch (event.eventName) {
      case 'GiveRight':
        return t('eventsTable.detailGiveRight', {
          addr: formatAddress(String(event.args['voter'])),
        });
      case 'Delegate':
        return t('eventsTable.detailDelegate', {
          from: formatAddress(String(event.args['from'])),
          to: formatAddress(String(event.args['to'])),
        });
      case 'Vote':
        return t('eventsTable.detailVote', {
          voter: formatAddress(String(event.args['voter'])),
          proposal: Number(event.args['proposal']),
        });
      default:
        return t('eventsTable.unknownEvent');
    }
  }

  if (isEventsLoading) {
    return (
      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle>{resolvedTitle}</CardTitle>
          <CardDescription>{resolvedDescription}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {Array.from({ length: maxEvents }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (lastEvents.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle>{resolvedTitle}</CardTitle>
          <CardDescription>{resolvedDescription}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('eventsTable.noEvents')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="bg-muted/50">
        <CardTitle>{resolvedTitle}</CardTitle>
        <CardDescription>{resolvedDescription}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('eventsTable.type')}</TableHead>
              <TableHead>{t('eventsTable.details')}</TableHead>
              <TableHead>{t('eventsTable.block')}</TableHead>
              <TableHead>{t('eventsTable.transaction')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lastEvents.map((event, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Badge variant="default">{event.eventName}</Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {formatEventDetails(event)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {Number(event.blockNumber)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {event.transactionHash
                    ? formatAddress(event.transactionHash)
                    : t('eventsTable.na')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
