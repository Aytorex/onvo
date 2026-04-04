'use client';

import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Smartphone } from 'lucide-react';

import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';

import { getWorldMiniAppUrl } from '@/lib/world-mini-app';
import { cn } from '@/lib/utils';

export function PayWorldAppHint({
  className,
}: Readonly<{ className?: string }>) {
  const { t } = useTranslation('common');
  const pathname = usePathname() || '/';
  const { isInstalled } = useMiniKit();
  const openUrl = getWorldMiniAppUrl(pathname);

  if (openUrl === null) {
    return null;
  }

  const shellClass =
    'rounded-2xl border border-border/60 bg-muted/15 px-3.5 py-2.5 text-[11px] leading-relaxed text-muted-foreground';

  if (isInstalled === true) {
    return (
      <div className={cn(shellClass, className)}>
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/90">
          {t('pay.worldAppSectionLabel')}
        </p>
        <div className="mt-1.5 flex items-start gap-2">
          <Smartphone
            className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80"
            aria-hidden
          />
          <p>{t('pay.worldAppInAppHint')}</p>
        </div>
        <a
          href="https://docs.world.org/mini-apps/commands/pay"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 font-medium text-primary/90 underline-offset-4 hover:text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" aria-hidden />
          {t('pay.worldAppPayDocs')}
        </a>
      </div>
    );
  }

  return (
    <div className={cn(shellClass, className)}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/90">
        {t('pay.worldAppSectionLabel')}
      </p>
      <p className="mt-1.5 text-foreground/90">{t('pay.worldAppOpenTitle')}</p>
      <p className="mt-1">{t('pay.worldAppOpenBody')}</p>
      <a
        href={openUrl}
        className="mt-2 inline-flex items-center gap-1 font-medium text-primary/90 underline-offset-4 hover:text-primary hover:underline"
      >
        <Smartphone className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {t('pay.worldAppOpenCta')}
        <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
      </a>
    </div>
  );
}
