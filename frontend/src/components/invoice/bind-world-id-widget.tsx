'use client';

import { Button } from '@/components/ui/button';
import { arcTestnet } from '@/lib/arc-chain';
import { invoiceRegistryContract } from '@/lib/contract';
import {
  extractNullifierFromIdKitResult,
  fetchRpContext,
  parseWorldIdNullifierToBigInt,
  verifyProof,
  WORLD_ID_CONFIG,
} from '@/lib/worldid';
import type { IDKitResult, RpContext } from '@worldcoin/idkit';
import { IDKitRequestWidget, orbLegacy } from '@worldcoin/idkit';
import { Loader2, Link2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';

type Props = {
  onBound?: () => void;
  /** Omit bordered panel when embedded in the dashboard setup card. */
  unstyled?: boolean;
};

/**
 * Binds the World ID nullifier to the connected wallet on-chain via `bindWorldId`
 * after IDKit proof verification (same flow as invoice creation).
 */
export function BindWorldIdWidget({ onBound, unstyled = false }: Props) {
  const { t } = useTranslation('common');
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitchChainPending } =
    useSwitchChain();
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const registryChainId = invoiceRegistryContract.chainId ?? arcTestnet.id;

  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [open, setOpen] = useState(false);
  const [loadingRp, setLoadingRp] = useState(false);
  /** True from right after World ID proof until chain switch + bind tx finish (covers gap before wagmi `isPending`). */
  const [onChainBinding, setOnChainBinding] = useState(false);
  const bindTxInFlightRef = useRef(false);

  const handleVerifyResult = useCallback(
    async (result: IDKitResult) => {
      const ok = await verifyProof(result);
      if (!ok) throw new Error(t('invoice.toast.worldIdRejected'));
    },
    [t],
  );

  const handleSuccess = useCallback(
    async (result: IDKitResult) => {
      if (bindTxInFlightRef.current) return;
      if (!address) {
        toast.error(t('invoice.toast.walletRequiredShort'));
        setOpen(false);
        return;
      }
      const raw = extractNullifierFromIdKitResult(result).trim();
      const nullifierBn = parseWorldIdNullifierToBigInt(raw);
      if (nullifierBn === null) {
        toast.error(t('invoice.toast.worldIdRequiredForInvoiceId'));
        setOpen(false);
        return;
      }
      bindTxInFlightRef.current = true;
      setOnChainBinding(true);
      const toastId = toast.loading(
        t('invoice.registerEmitter.bindingInProgress'),
      );
      try {
        if (chainId !== registryChainId) {
          try {
            await switchChainAsync({ chainId: registryChainId });
          } catch {
            toast.error(t('invoice.toast.arcNetworkRequired'), { id: toastId });
            setOpen(false);
            return;
          }
        }
        try {
          await writeContractAsync({
            address: invoiceRegistryContract.address,
            abi: invoiceRegistryContract.abi,
            functionName: 'bindWorldId',
            args: [nullifierBn],
            chainId: registryChainId,
          });
          toast.success(t('invoice.toast.registerSuccess'), { id: toastId });
          setOpen(false);
          onBound?.();
        } catch (e) {
          console.error(e);
          toast.error(
            e instanceof Error
              ? e.message
              : t('invoice.toast.registerTxFailed'),
            { id: toastId },
          );
          setOpen(false);
        }
      } finally {
        bindTxInFlightRef.current = false;
        setOnChainBinding(false);
      }
    },
    [
      address,
      chainId,
      onBound,
      registryChainId,
      switchChainAsync,
      t,
      writeContractAsync,
    ],
  );

  async function start() {
    if (!address) {
      toast.error(t('invoice.toast.connectWalletFirst'));
      return;
    }
    setLoadingRp(true);
    try {
      const ctx = await fetchRpContext();
      setRpContext(ctx);
      setOpen(true);
    } catch {
      toast.error(t('invoice.toast.worldIdInitRp'));
    } finally {
      setLoadingRp(false);
    }
  }

  if (!isConnected || !address) return null;

  const bindingBusy = onChainBinding || isSwitchChainPending || isWritePending;

  const body = (
    <>
      {!unstyled ? (
        <p className="font-medium text-foreground">
          {t('invoice.registerEmitter.title')}
        </p>
      ) : null}
      <p
        className={
          unstyled
            ? 'text-muted-foreground text-sm'
            : 'mt-2 text-muted-foreground'
        }
      >
        <Trans
          i18nKey="invoice.registerEmitter.description"
          ns="common"
          components={{ code: <code className="text-xs" /> }}
        />
      </p>
      <Button
        type="button"
        className={unstyled ? 'mt-3' : 'mt-4'}
        disabled={loadingRp || bindingBusy}
        aria-label={t('invoice.registerEmitter.button')}
        aria-busy={bindingBusy}
        onClick={() => void start()}
      >
        {loadingRp || bindingBusy ? (
          <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <Link2 className="mr-2 h-4 w-4 shrink-0" />
        )}
        <span className="sm:hidden">
          {t('invoice.registerEmitter.buttonShort')}
        </span>
        <span className="hidden sm:inline">
          {t('invoice.registerEmitter.button')}
        </span>
      </Button>

      {bindingBusy ? (
        <p
          className="mt-3 flex items-start gap-2 text-muted-foreground text-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2
            className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary"
            aria-hidden
          />
          <span>{t('invoice.registerEmitter.bindingInProgress')}</span>
        </p>
      ) : null}

      {rpContext ? (
        <IDKitRequestWidget
          open={open}
          onOpenChange={setOpen}
          app_id={WORLD_ID_CONFIG.app_id}
          action={WORLD_ID_CONFIG.action}
          rp_context={rpContext}
          allow_legacy_proofs={true}
          preset={orbLegacy({ signal: address })}
          environment={WORLD_ID_CONFIG.environment}
          handleVerify={handleVerifyResult}
          onSuccess={(r) => void handleSuccess(r)}
          onError={() => {
            toast.error(t('invoice.toast.worldIdCancelled'));
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );

  if (unstyled) {
    return <div className="text-sm">{body}</div>;
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-4 text-sm">
      {body}
    </div>
  );
}
