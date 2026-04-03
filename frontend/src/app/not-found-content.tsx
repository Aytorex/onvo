'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export function NotFoundContent() {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8 lg:py-12">
      <Card className="w-full max-w-md border-dashed bg-card shadow-md">
        <CardHeader className="items-center space-y-4 pb-2 text-center">
          <p className="font-mono text-6xl font-bold leading-none tracking-tighter text-muted-foreground/25">
            404
          </p>
          <div className="space-y-2">
            <CardTitle className="text-xl font-semibold sm:text-2xl">
              {t('notFound.title')}
            </CardTitle>
            <CardDescription className="text-pretty text-base">
              {t('notFound.description')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              {t('notFound.backHome')}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
