'use client';

import { Button } from '@/components/ui/button';
import { arcTestnet } from '@/lib/arc-chain';
import { registerEmitterOnChain } from '@/lib/register-emitter-onchain';
import { fetchRpContext, verifyProof, WORLD_ID_CONFIG } from '@/lib/worldid';
import type { IDKitResult, RpContext } from '@worldcoin/idkit';
import { IDKitRequestWidget, orbLegacy } from '@worldcoin/idkit';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useCallback, useState } from 'react';
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
  const { address, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  /** Client Arc pour le receipt même si le wallet était sur un autre réseau au montage. */
  const publicClientArc = usePublicClient({ chainId: arcTestnet.id });
  const { writeContractAsync, isPending } = useWriteContract();

  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [open, setOpen] = useState(false);
  const [loadingRp, setLoadingRp] = useState(false);

  const handleVerifyResult = useCallback(async (result: IDKitResult) => {
    const ok = await verifyProof(result);
    if (!ok) throw new Error('Vérification World ID refusée');
  }, []);

  const handleSuccess = useCallback(
    async (result: IDKitResult) => {
      if (!address) {
        toast.error('Wallet requis.');
        setOpen(false);
        return;
      }

      try {
        await registerEmitterOnChain(result, {
          switchChainAsync,
          writeContractAsync,
          publicClientArc,
        });
        toast.success('Adresse enregistrée comme émetteur vérifié.');
        setOpen(false);
        onRegistered?.();
      } catch (e) {
        console.error(e);
        toast.error(
          e instanceof Error
            ? e.message
            : 'Transaction registerWithWorldId échouée.',
        );
        setOpen(false);
      }
    },
    [address, onRegistered, publicClientArc, switchChainAsync, writeContractAsync],
  );

  async function start() {
    if (!address) {
      toast.error(
        'Connectez d’abord votre wallet (même adresse que pour les factures).',
      );
      return;
    }
    setLoadingRp(true);
    try {
      const ctx = await fetchRpContext();
      setRpContext(ctx);
      setOpen(true);
    } catch {
      toast.error('Impossible d’initialiser World ID (RP).');
    } finally {
      setLoadingRp(false);
    }
  }

  if (!isConnected || !address) return null;

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-4 text-sm">
      <p className="font-medium text-foreground">
        Enregistrement émetteur on-chain
      </p>
      <p className="mt-2 text-muted-foreground">
        Une transaction <code className="text-xs">registerWithWorldId</code> lie
        votre wallet à World ID sur Arc. Utilisez le même wallet que pour signer
        les factures.
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
        Enregistrer mon wallet avec World ID
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
            toast.error('World ID annulé ou erreur.');
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
