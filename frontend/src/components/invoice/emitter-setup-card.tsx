'use client';

import { BindWorldIdWidget } from '@/components/invoice/bind-world-id-widget';
import { Button } from '@/components/ui/button';
import { useEmitterOnChainReady } from '@/lib/emitter-onchain';
import { cn } from '@/lib/utils';
import {
  Check,
  CheckCircle2,
  Lock,
  Orbit,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccount, useConnect } from 'wagmi';

type Props = {
  onRegistered?: () => void;
};

type StepState = 'complete' | 'current' | 'upcoming';

function EmitterSetupConnectButton() {
  const { t } = useTranslation('common');
  const { connect, connectors, isPending } = useConnect();
  const injected = connectors.find(
    (c) => c.type === 'injected' || c.id === 'injected',
  );

  return (
    <Button
      type="button"
      variant="default"
      size="lg"
      className="gap-2 text-base shadow-lg shadow-primary/25"
      disabled={isPending || !injected}
      onClick={() => injected && connect({ connector: injected })}
    >
      <Wallet className="size-5 shrink-0 opacity-90" aria-hidden />
      {isPending ? t('wallet.connecting') : t('wallet.connect')}
    </Button>
  );
}

function StepMarker({ state, step }: { state: StepState; step: number }) {
  return (
    <div
      className={cn(
        'relative flex size-[3.25rem] shrink-0 items-center justify-center rounded-2xl font-semibold tabular-nums transition-all duration-500',
        state === 'complete' &&
          'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/35',
        state === 'current' &&
          'border-2 border-primary bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.2),0_0_24px_-4px_hsl(var(--primary)/0.45)] dark:from-primary/25 dark:to-primary/10',
        state === 'upcoming' &&
          'border-2 border-dashed border-muted-foreground/30 bg-muted/25 text-muted-foreground',
      )}
    >
      {state === 'complete' ? (
        <Check className="size-6" strokeWidth={2.75} aria-hidden />
      ) : (
        <span className="text-lg" aria-hidden>
          {step}
        </span>
      )}
      {state === 'current' ? (
        <span
          className="absolute inset-[-4px] rounded-[1.15rem] border border-primary/25 opacity-70 animate-emitter-setup-glow"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

export function EmitterSetupCard({ onRegistered }: Props) {
  const { t } = useTranslation('common');
  const { isConnected } = useAccount();
  const { worldIdAuthorizedOnChain } = useEmitterOnChainReady();

  const step1State: StepState = isConnected ? 'complete' : 'current';
  const step2State: StepState = !isConnected
    ? 'upcoming'
    : worldIdAuthorizedOnChain === true
      ? 'complete'
      : 'current';

  return (
    <section
      className="relative mx-auto w-full max-w-2xl animate-fade-in-up"
      aria-labelledby="emitter-setup-title"
    >
      <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-violet-500/35 via-primary/25 to-cyan-400/30 p-[1.5px] shadow-[0_32px_80px_-24px_hsl(var(--primary)/0.35)]">
        {/* Glows clipped so they do not extend <main> scroll height */}
        <div
          className="pointer-events-none absolute inset-[1.5px] overflow-hidden rounded-[calc(1.75rem-1.5px)]"
          aria-hidden
        >
          <div className="absolute -left-[12%] -top-[35%] size-[min(20rem,72vw)] rounded-full bg-gradient-to-br from-violet-500/35 via-primary/18 to-transparent blur-[72px] animate-emitter-setup-glow" />
          <div className="absolute -bottom-[38%] -right-[12%] size-[min(17rem,58vw)] rounded-full bg-gradient-to-tl from-cyan-400/22 via-primary/12 to-transparent blur-[64px] animate-emitter-setup-orbit" />
        </div>

        <div className="relative z-[1] overflow-hidden rounded-[calc(1.75rem-1.5px)] border border-border/40 bg-card/85 shadow-inner backdrop-blur-2xl dark:bg-card/75">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.07) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
            aria-hidden
          />

          <div className="relative px-6 py-8 sm:px-10 sm:py-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" aria-hidden />
                {t('invoice.dashboard.emitterSetupKicker')}
              </div>
              <h2
                id="emitter-setup-title"
                className="text-balance font-semibold text-heading text-2xl tracking-tight sm:text-[1.65rem] sm:leading-snug"
              >
                {t('invoice.dashboard.emitterSetupTitle')}
              </h2>
              <p className="max-w-lg text-pretty text-muted-foreground text-sm leading-relaxed sm:text-[0.9375rem]">
                {t('invoice.dashboard.emitterSetupSubtitle')}
              </p>
            </div>

            <ol
              className="mt-10 space-y-0"
              aria-label={t('invoice.dashboard.emitterSetupStepsAria')}
            >
              <li
                className="flex gap-5 sm:gap-6"
                aria-current={step1State === 'current' ? 'step' : undefined}
              >
                <div className="flex flex-col items-center">
                  <StepMarker state={step1State} step={1} />
                  <div
                    className={cn(
                      'mt-3 w-px min-h-[4.5rem] flex-1 shrink-0 rounded-full transition-colors duration-700',
                      isConnected
                        ? 'bg-gradient-to-b from-emerald-500/90 via-primary/45 to-violet-500/50'
                        : 'bg-gradient-to-b from-muted-foreground/15 to-muted-foreground/10',
                    )}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 flex-1 pb-2 pt-1">
                  <h3 className="font-semibold text-foreground text-lg tracking-tight">
                    {t('invoice.dashboard.setupStepWallet')}
                  </h3>
                  <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed">
                    {t('invoice.dashboard.emitterSetupWalletLead')}
                  </p>
                  <div className="mt-5">
                    {isConnected ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        disabled
                        className="pointer-events-none gap-2 border-emerald-500/40 bg-emerald-500/[0.12] text-base text-emerald-900 shadow-sm dark:text-emerald-100"
                      >
                        <CheckCircle2
                          className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                          aria-hidden
                        />
                        {t('invoice.dashboard.walletConnected')}
                      </Button>
                    ) : (
                      <EmitterSetupConnectButton />
                    )}
                  </div>
                </div>
              </li>

              <li
                className="flex gap-5 sm:gap-6"
                aria-current={step2State === 'current' ? 'step' : undefined}
              >
                <div className="flex flex-col items-center">
                  <StepMarker state={step2State} step={2} />
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground text-lg tracking-tight">
                      {t('invoice.dashboard.setupStepRegister')}
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                      <Orbit className="size-3" aria-hidden />
                      World ID
                    </span>
                  </div>
                  <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed">
                    {t('invoice.dashboard.emitterSetupWorldLead')}
                  </p>

                  <div className="relative mt-5">
                    <div
                      className={cn(
                        'relative overflow-hidden rounded-2xl border p-4 transition-all duration-500 sm:p-5',
                        isConnected
                          ? 'border-violet-500/25 bg-gradient-to-br from-violet-500/[0.08] via-card/50 to-cyan-500/[0.06] shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.04)] dark:from-violet-400/[0.1] dark:to-cyan-400/[0.05]'
                          : 'border-dashed border-muted-foreground/20 bg-muted/15',
                      )}
                    >
                      {!isConnected ? (
                        <div className="flex gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/80">
                            <Lock
                              className="size-[18px] text-muted-foreground"
                              aria-hidden
                            />
                          </div>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {t('invoice.dashboard.setupRegisterAfterWallet')}
                          </p>
                        </div>
                      ) : (
                        <div className="[&_button]:h-11 [&_button]:rounded-full [&_button]:px-8 [&_button]:text-base [&_button]:shadow-md [&_button]:shadow-primary/15">
                          <BindWorldIdWidget unstyled onBound={onRegistered} />
                        </div>
                      )}
                      {isConnected ? (
                        <div
                          className="pointer-events-none absolute -right-4 -top-4 size-28 rounded-full bg-gradient-to-br from-violet-400/30 to-cyan-400/12 blur-2xl animate-emitter-setup-glow"
                          aria-hidden
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
