'use client';

import { EventsTable } from './events-table';
import { useTranslation } from 'react-i18next';

export function VoterEventsTable() {
  const { t } = useTranslation('common');

  return (
    <EventsTable
      title={t('voterEventsTable.title')}
      description={t('voterEventsTable.description')}
      eventTypes={['GiveRight', 'Delegate']}
      maxEvents={5}
    />
  );
}
