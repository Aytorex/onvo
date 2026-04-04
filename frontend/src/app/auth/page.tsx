'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IDKitRequestWidget,
  orbLegacy,
  type RpContext,
} from '@worldcoin/idkit';
import Image from 'next/image';
import { OnvoLogo } from '@/components/shared/onvo-logo';
import { Button } from '@/components/ui/button';
import { useWorldID, fetchRpContext, WORLD_ID_CONFIG } from '@/lib/worldid';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const {
    isVerified,
    isWidgetOpen,
    setIsWidgetOpen,
    handleVerifyResult,
    handleSuccess,
  } = useWorldID();

  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [isLoadingRp, setIsLoadingRp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVerified) {
      router.push('/dashboard');
    }
  }, [isVerified, router]);

  async function handleVerifyClick() {
    setError(null);
    setIsLoadingRp(true);

    try {
      const ctx = await fetchRpContext();
      setRpContext(ctx);
      setIsWidgetOpen(true);
    } catch {
      setError(t('auth.initError'));
    } finally {
      setIsLoadingRp(false);
    }
  }

  if (isVerified) return null;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full rounded-2xl border border-border/40 bg-card/80 p-8 shadow-xl backdrop-blur-md sm:p-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-3">
            <OnvoLogo className="text-3xl sm:text-4xl" />
            <p className="max-w-xs text-center text-sm text-muted-foreground">
              {t('auth.tagline')}
            </p>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="flex w-full flex-col items-center gap-4">
            <p className="text-center text-sm text-muted-foreground">
              {t('auth.verifyIntro')}
            </p>

            <Button
              size="lg"
              className="w-full"
              onClick={handleVerifyClick}
              disabled={isLoadingRp}
            >
              {isLoadingRp ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              {t('auth.verifyButton')}
            </Button>

            {error && (
              <p className="text-center text-sm text-destructive">{error}</p>
            )}

            <p className="text-center text-xs text-muted-foreground/60">
              {t('auth.stagingNoteBefore')}{' '}
              <a
                href="https://simulator.worldcoin.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-muted-foreground"
              >
                {t('auth.simulatorLink')}
              </a>{' '}
              {t('auth.stagingNoteAfter')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
        <span>Powered by</span>
        <Image
          src="/logos/world.svg"
          alt="World"
          width={60}
          height={16}
          className="block h-4 w-auto opacity-60 dark:hidden"
        />
        <Image
          src="/logos/world-dark.svg"
          alt="World"
          width={60}
          height={16}
          className="hidden h-4 w-auto opacity-60 dark:block"
        />
      </div>

      {rpContext ? (
        <IDKitRequestWidget
          open={isWidgetOpen}
          onOpenChange={setIsWidgetOpen}
          app_id={WORLD_ID_CONFIG.app_id}
          action={WORLD_ID_CONFIG.action}
          rp_context={rpContext}
          allow_legacy_proofs={true}
          preset={orbLegacy()}
          environment={WORLD_ID_CONFIG.environment}
          handleVerify={handleVerifyResult}
          onSuccess={handleSuccess}
          onError={(errorCode) => {
            setError(t('auth.verificationError', { code: String(errorCode) }));
            setIsWidgetOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
