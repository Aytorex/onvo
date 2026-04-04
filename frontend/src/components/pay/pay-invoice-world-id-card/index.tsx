'use client';

import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useWorldProfileByAddress } from '@/hooks/use-world-profile';
import { cn } from '@/lib/utils';

import { shortIssuerAddress, worldAppProfileDeepLink } from './utils';
import { WorldIssuerAvatar } from './world-issuer-avatar';
import { WorldIssuerProfileText } from './world-issuer-profile-text';

export function PayInvoiceWorldIdCard({
  issuerWorldId,
  compact = false,
}: Readonly<{ issuerWorldId: string; compact?: boolean }>) {
  const { t } = useTranslation('common');
  const hasId = issuerWorldId.length > 0;
  const qrValue = hasId ? worldAppProfileDeepLink(issuerWorldId) : '';
  const [qrOpen, setQrOpen] = useState(false);
  const { loading, profile, failed } = useWorldProfileByAddress(
    hasId ? issuerWorldId : null,
  );
  const shortIssuer = shortIssuerAddress(issuerWorldId);

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl border shadow-sm',
        'border-onvo-purple/20 bg-gradient-to-br from-card via-card to-onvo-purple/[0.07]',
        'dark:border-onvo-purple/30 dark:to-onvo-cyan/[0.05]',
        compact ? 'p-3 sm:p-4' : 'p-5 sm:p-6',
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-onvo-purple/15 to-onvo-cyan/10 blur-3xl" />

      <div
        className={cn('relative flex flex-col', compact ? 'gap-3' : 'gap-4')}
      >
        <header className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative h-8 shrink-0 w-[5.5rem]">
            <Image
              src="/logos/world.svg"
              alt=""
              width={96}
              height={24}
              className="h-7 w-auto dark:hidden"
            />
            <Image
              src="/logos/world-dark.svg"
              alt=""
              width={120}
              height={30}
              className="hidden h-7 w-auto dark:block"
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold leading-tight text-heading">
              {t('pay.worldIdQrTitle')}
            </h2>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              {t('pay.worldIdSubtitle')}
            </p>
          </div>
        </header>

        {!hasId ? (
          <p className="rounded-xl border border-dashed border-border/80 bg-muted/15 px-3 py-2.5 text-xs text-muted-foreground">
            {t('pay.worldIdUnavailable')}
          </p>
        ) : (
          <>
            <div
              className={cn(
                'flex gap-3 rounded-2xl border border-border/60 bg-background/60 p-3 backdrop-blur-sm',
                'dark:bg-background/40',
              )}
            >
              <WorldIssuerAvatar
                loading={loading}
                profilePictureUrl={profile?.profilePictureUrl ?? null}
              />
              <div className="min-w-0 flex-1 py-0.5">
                <WorldIssuerProfileText
                  loading={loading}
                  failed={failed}
                  profile={profile}
                  shortIssuer={shortIssuer}
                />
              </div>
            </div>

            <Collapsible open={qrOpen} onOpenChange={setQrOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-between rounded-xl border-border/80 bg-background/80 py-5 text-left font-medium"
                >
                  <span>
                    {qrOpen ? t('pay.worldIdHideQr') : t('pay.worldIdShowQr')}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 opacity-70 transition-transform duration-200',
                      qrOpen && 'rotate-180',
                    )}
                    aria-hidden
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden">
                <div className="pt-3">
                  <p className="mb-3 text-center text-[11px] text-muted-foreground">
                    {t('pay.worldIdQrPanelHint')}
                  </p>
                  <div className="flex justify-center">
                    <div
                      className="rounded-xl bg-white p-2.5 shadow-md ring-1 ring-black/10"
                      role="img"
                      aria-label={`${t('pay.worldIdQrTitle')}: ${issuerWorldId}`}
                    >
                      <QRCode
                        value={qrValue}
                        size={compact ? 112 : 128}
                        style={{
                          height: 'auto',
                          maxWidth: '100%',
                          width: '100%',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </div>
    </section>
  );
}
