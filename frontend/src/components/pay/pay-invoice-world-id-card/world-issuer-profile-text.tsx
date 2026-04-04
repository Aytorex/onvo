'use client';

import { useTranslation } from 'react-i18next';

import type { WorldIssuerProfile } from '@/hooks/use-world-profile';

export function WorldIssuerProfileText({
  loading,
  failed,
  profile,
  shortIssuer,
}: Readonly<{
  loading: boolean;
  failed: boolean;
  profile: WorldIssuerProfile | null;
  shortIssuer: string;
}>) {
  const { t } = useTranslation('common');

  if (loading) {
    return (
      <p className="text-xs text-muted-foreground">
        {t('pay.worldIdProfileLoading')}
      </p>
    );
  }

  if (failed) {
    return (
      <>
        <p className="text-xs text-amber-800 dark:text-amber-200/90">
          {t('pay.worldIdProfileError')}
        </p>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          {shortIssuer}
        </p>
      </>
    );
  }

  if (profile?.username) {
    return (
      <>
        <p className="truncate text-sm font-semibold text-foreground">
          @{profile.username}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
          {shortIssuer}
        </p>
      </>
    );
  }

  return (
    <>
      <p className="text-xs text-muted-foreground">
        {t('pay.worldIdNoPublicName')}
      </p>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
        {shortIssuer}
      </p>
    </>
  );
}
