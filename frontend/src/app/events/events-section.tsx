'use client';

import { EventsTable } from '@/components/shared/events-table';
import { useTranslation } from 'react-i18next';

export function EventsSection() {
  const { t } = useTranslation('common');

  return (
    <EventsTable
      title={t('eventsTable.allTitle')}
      description={t('eventsTable.allDescription')}
      eventTypes={['GiveRight', 'Delegate', 'Vote']}
      maxEvents={10}
    />
  );
}
