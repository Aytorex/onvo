'use client';

import { Button } from '@/components/ui/button';
import { arcTestnet } from '@/lib/arc-chain';
import { invoiceRegistryContract } from '@/lib/contract';
import { registerEmitterOnChain } from '@/lib/register-emitter-onchain';
import { fetchRpContext, verifyProof, WORLD_ID_CONFIG } from '@/lib/worldid';
import type { IDKitResult, RpContext } from '@worldcoin/idkit';
import { IDKitRequestWidget, orbLegacy } from '@worldcoin/idkit';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';

type Props = {
  onRegistered?: () => void;
};

/**
 * Enregistre `msg.sender` comme émetteur vérifié via `registerWithWorldId`.
 * La preuve doit être obtenue avec le **même wallet** en `signal` (`orbLegacy({ signal: address })`)
 * pour correspondre au `signalHash` attendu par le contrat.
 */
export function RegisterEmitterWidget({ onRegistered }: Props) {
  const { t } = useTranslation('common');
  const { address, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const registryChainId = invoiceRegistryContract.chainId ?? arcTestnet.id;
  const publicClientArc = usePublicClient({ chainId: registryChainId });
  const { writeContractAsync, isPending } = useWriteContract();

  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [open, setOpen] = useState(false);
  const [loadingRp, setLoadingRp] = useState(false);

  const handleVerifyResult = useCallback(
    async (result: IDKitResult) => {
      const ok = await verifyProof(result);
      if (!ok) throw new Error(t('invoice.toast.worldIdRejected'));
    },
    [t],
  );

  const handleSuccess = useCallback(
    async (result: IDKitResult) => {
      if (!address) {
        toast.error(t('invoice.toast.walletRequiredShort'));
        setOpen(false);
        return;
      }

      try {
        await registerEmitterOnChain(result, {
          switchChainAsync,
          writeContractAsync,
          publicClientArc,
          registryChainId,
        });
        toast.success(t('invoice.toast.registerSuccess'));
        setOpen(false);
        onRegistered?.();
      } catch (e) {
        console.error(e);
        toast.error(
          e instanceof Error ? e.message : t('invoice.toast.registerTxFailed'),
        );
        setOpen(false);
      }
    },
    [
      address,
      onRegistered,
      publicClientArc,
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

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-4 text-sm">
      <p className="font-medium text-foreground">
        {t('invoice.registerEmitter.title')}
      </p>
      <p className="mt-2 text-muted-foreground">
        <Trans
          i18nKey="invoice.registerEmitter.description"
          ns="common"
          components={{ code: <code className="text-xs" /> }}
        />
      </p>
      <Button
        type="button"
        className="mt-4"
        disabled={loadingRp || isPending}
        onClick={() => void start()}
      >
        {loadingRp || isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="mr-2 h-4 w-4" />
        )}
        {t('invoice.registerEmitter.button')}
      </Button>

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
    </div>
  );
}
