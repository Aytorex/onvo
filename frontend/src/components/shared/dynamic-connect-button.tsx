'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DynamicContext,
  useDynamicContext,
} from '@dynamic-labs/sdk-react-core';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useConnect } from 'wagmi';

const btn =
  'border-0 bg-[#4779FF] font-semibold text-white shadow-md shadow-[#4779FF]/25 hover:bg-[#3d66db] hover:text-white';

type Props = Readonly<{
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  fullWidth?: boolean;
  /** Overrides the default “Connect” label (e.g. “Connect with Dynamic”). */
  connectLabel?: string;
}>;

function sizeClasses(size: Props['size']) {
  return cn(
    size === 'sm' && 'h-9 gap-2 px-3 text-sm',
    size === 'lg' && 'h-12 gap-2 px-5 text-base',
    (size === 'default' || !size) && 'h-10 gap-2 px-4',
  );
}

function Logo() {
  return (
    <>
      <Image
        src="/logos/dynamic.svg"
        alt=""
        width={72}
        height={16}
        className="h-4 w-auto dark:hidden"
      />
      <Image
        src="/logos/dynamic-dark.svg"
        alt=""
        width={72}
        height={16}
        className="hidden h-4 w-auto dark:block"
      />
    </>
  );
}

function Fallback({ className, size, fullWidth, connectLabel }: Props) {
  const { t } = useTranslation('common');
  const { connect, connectors, isPending } = useConnect();
  const injected = connectors.find(
    (c) => c.type === 'injected' || c.id === 'injected',
  );

  return (
    <Button
      type="button"
      variant="default"
      size={size === 'lg' ? 'lg' : 'default'}
      className={cn(btn, sizeClasses(size), fullWidth && 'w-full', className)}
      disabled={isPending || !injected}
      onClick={() => injected && connect({ connector: injected })}
    >
      <Logo />
      {isPending ? (
        <>
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          {t('wallet.connecting')}
        </>
      ) : (
        (connectLabel ?? t('wallet.connect'))
      )}
    </Button>
  );
}

function WithDynamic({ className, size, fullWidth, connectLabel }: Props) {
  const { t } = useTranslation('common');
  const { setShowAuthFlow, sdkHasLoaded } = useDynamicContext();

  return (
    <Button
      type="button"
      size={size === 'lg' ? 'lg' : 'default'}
      className={cn(btn, sizeClasses(size), fullWidth && 'w-full', className)}
      disabled={!sdkHasLoaded}
      onClick={() => setShowAuthFlow(true)}
    >
      <Logo />
      {!sdkHasLoaded ? (
        <>
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          {t('wallet.connecting')}
        </>
      ) : (
        (connectLabel ?? t('wallet.connect'))
      )}
    </Button>
  );
}

/** Ouvre la modale Dynamic si le provider est présent, sinon connexion injectée wagmi. */
export function DynamicConnectButton(props: Props) {
  const ctx = useContext(DynamicContext);
  return ctx ? <WithDynamic {...props} /> : <Fallback {...props} />;
}
