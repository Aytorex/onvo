'use client';

import { useDataStore } from '@/stores/use-data-store';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BookUser } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export function ChairPerson() {
  const { t } = useTranslation('common');
  const chairPerson = useDataStore((s) => s.data.chairPerson);

  return (
    <Card>
      <CardHeader className="bg-muted/50">
        <CardTitle className="text-2xl font-semibold leading-none tracking-tight">
          {t('chairPerson.title')}
        </CardTitle>
        <CardDescription>{t('chairPerson.description')}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-3">
          <dl className="grid gap-3">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1 text-muted-foreground">
                <BookUser className="h-5 w-5 mr-2" />
                {t('chairPerson.address')}
              </dt>
              <dd>
                {!chairPerson ? (
                  <Skeleton className="h-6 w-48 rounded-full" />
                ) : (
                  <Badge className="h-6" variant="secondary">
                    {chairPerson}
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
