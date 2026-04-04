'use client';

import { User } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

export function WorldIssuerAvatar({
  loading,
  profilePictureUrl,
}: Readonly<{
  loading: boolean;
  profilePictureUrl: string | null;
}>) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [profilePictureUrl]);

  let inner: ReactNode;
  if (loading) {
    inner = <div className="h-full w-full animate-pulse bg-muted" />;
  } else if (profilePictureUrl && !broken) {
    inner = (
      // eslint-disable-next-line @next/next/no-img-element -- World profile CDN hostnames vary
      <img
        src={profilePictureUrl}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setBroken(true)}
      />
    );
  } else {
    inner = (
      <User
        className="h-7 w-7 text-onvo-purple/80 dark:text-onvo-cyan/80"
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn(
        'relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-onvo-purple/15 to-onvo-cyan/10 ring-2 ring-onvo-purple/20',
      )}
    >
      {inner}
    </div>
  );
}
