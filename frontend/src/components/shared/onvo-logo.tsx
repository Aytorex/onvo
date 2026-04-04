'use client';

import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function OnvoLogo({ className }: Readonly<{ className?: string }>) {
  const { t } = useTranslation('common');

  return (
    <div
      className={cn(
        'select-none text-2xl font-bold tracking-tight sm:text-3xl',
        className,
      )}
      role="img"
      aria-label={t('brand.logoAria')}
    >
      <span className="text-heading">ONV</span>
      <span className="bg-gradient-to-r from-onvo-purple to-onvo-cyan bg-clip-text text-transparent">
        O
      </span>
    </div>
  );
}
