'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';

const ICON_SIZE = 32;

type IconProps = {
  className?: string;
};

export function UsdcIcon({ className }: IconProps) {
  return (
    <Image
      src="/logos/usdc.svg"
      alt=""
      width={ICON_SIZE}
      height={ICON_SIZE}
      className={cn('shrink-0 object-contain', className)}
      aria-hidden
    />
  );
}

export function EurcIcon({ className }: IconProps) {
  return (
    <Image
      src="/logos/eurc.svg"
      alt=""
      width={ICON_SIZE}
      height={ICON_SIZE}
      className={cn('shrink-0 object-contain', className)}
      aria-hidden
    />
  );
}
