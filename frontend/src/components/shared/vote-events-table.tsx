'use client';

import { EventsTable } from './events-table';
import { useTranslation } from 'react-i18next';

export function VoteEventsTable() {
  const { t } = useTranslation('common');

  return (
    <EventsTable
      title={t('voteEventsTable.title')}
      description={t('voteEventsTable.description')}
      eventTypes={['Vote']}
      maxEvents={5}
    />
  );
}
