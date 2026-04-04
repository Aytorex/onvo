'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IDKitRequestWidget,
  orbLegacy,
  type RpContext,
} from '@worldcoin/idkit';
import { OnvoLogo } from '@/components/shared/onvo-logo';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { useWorldID, fetchRpContext, WORLD_ID_CONFIG } from '@/lib/worldid';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
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
      setError('Failed to initialize verification. Please try again.');
    } finally {
      setIsLoadingRp(false);
    }
  }

  if (isVerified) return null;

  return (
    <div className="w-full max-w-md px-4">
      <Card className="border-border/60 bg-card shadow-md backdrop-blur-sm">
        <CardHeader className="items-center space-y-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-onvo-purple/15 to-onvo-cyan/15">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <OnvoLogo className="text-center text-3xl sm:text-4xl" />
            <CardDescription className="text-base text-muted-foreground">
              B2B invoicing powered by World ID
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pb-8">
          <p className="text-center text-sm text-muted-foreground">
            Verify your identity with World ID to access the platform.
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
            Verify with World ID
          </Button>

          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}

          <p className="text-center text-xs text-muted-foreground/60">
            Staging environment &mdash; use the{' '}
            <a
              href="https://simulator.worldcoin.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-muted-foreground"
            >
              World ID Simulator
            </a>{' '}
            for testing
          </p>
        </CardContent>
      </Card>

      {rpContext && (
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
            setError(`Verification error: ${errorCode}`);
            setIsWidgetOpen(false);
          }}
        />
      )}
    </div>
  );
}
