'use client';

import onvoIcon from '@/app/icon.png';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

const LOGO_MARK_PX = 36;

/** Marque seule (icône), pour en-tête quand le menu latéral est réduit. */
export function OnvoLogoMark({
  className,
  decorative = false,
}: Readonly<{ className?: string; decorative?: boolean }>) {
  const { t } = useTranslation('common');
  const label = t('brand.logoAria');

  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 flex-none items-center justify-center',
        className,
      )}
      {...(decorative ? { 'aria-hidden': true as const } : {})}
    >
      <Image
        src={onvoIcon}
        alt={decorative ? '' : label}
        width={LOGO_MARK_PX}
        height={LOGO_MARK_PX}
        className="h-full w-full object-contain object-center"
        sizes={`${LOGO_MARK_PX}px`}
        priority={false}
      />
    </div>
  );
}
