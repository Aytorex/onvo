'use client';

import { RegisterEmitterWidget } from '@/components/invoice/register-emitter-widget';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccount, useConnect } from 'wagmi';

type Props = {
  onRegistered?: () => void;
};

/** Connect CTA for the issuer setup card; the shell header keeps using `WalletButton`. */
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
      className="gap-2 text-base"
      disabled={isPending || !injected}
      onClick={() => injected && connect({ connector: injected })}
    >
      <Wallet className="size-5 shrink-0 opacity-80" aria-hidden />
      {isPending ? t('wallet.connecting') : t('wallet.connect')}
    </Button>
  );
}

export function EmitterSetupCard({ onRegistered }: Props) {
  const { t } = useTranslation('common');
  const { isConnected } = useAccount();

  return (
    <div className="rounded-2xl border border-border/80 bg-card/70 p-6 shadow-sm backdrop-blur-sm">
      <h2 className="font-semibold text-heading text-lg tracking-tight">
        {t('invoice.dashboard.emitterSetupTitle')}
      </h2>
      <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
        {t('invoice.dashboard.emitterSetupSubtitle')}
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 sm:items-start">
        <div className="space-y-3">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {t('invoice.dashboard.setupStepWallet')}
          </p>
          {isConnected ? (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              disabled
              className="pointer-events-none gap-2 border-emerald-500/35 bg-emerald-500/10 text-base text-emerald-800 dark:text-emerald-200"
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
        <div className="space-y-3">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {t('invoice.dashboard.setupStepRegister')}
          </p>
          {isConnected ? (
            <RegisterEmitterWidget unstyled onRegistered={onRegistered} />
          ) : (
            <p className="text-muted-foreground text-sm">
              {t('invoice.dashboard.setupRegisterAfterWallet')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
