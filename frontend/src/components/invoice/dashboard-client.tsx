'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { exportInvoicesCSV } from '@/lib/invoice-csv';
import { readInvoice } from '@/lib/invoice-contract';
import type { InvoiceRowView } from '@/lib/invoice-types';
import {
  downloadBase64Pdf,
  getInvoiceMeta,
  getInvoicePdfBase64,
  getStoredInvoiceIds,
} from '@/lib/invoice-storage';
import { invoiceRegistryContract } from '@/lib/contract';
import { useWorldID } from '@/lib/worldid';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { arcTestnet } from 'viem/chains';
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';

function statusBadge(status: 0 | 1 | 2) {
  if (status === 0)
    return (
      <Badge variant="outline" className="border-amber-500/60 text-amber-400">
        PENDING
      </Badge>
    );
  if (status === 1)
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/60 text-emerald-400"
      >
        PAID
      </Badge>
    );
  return (
    <Badge variant="secondary" className="text-muted-foreground">
      CANCELLED
    </Badge>
  );
}

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function DashboardClient() {
  const router = useRouter();
  const { isVerified } = useWorldID();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending: isCancelPending } = useWriteContract();

  const [rows, setRows] = useState<InvoiceRowView[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!address || !publicClient) {
      setRows([]);
      setLoading(false);
      return;
    }
    const ids = getStoredInvoiceIds(address);
    const next: InvoiceRowView[] = [];
    for (const id of ids) {
      try {
        const inv = await readInvoice(publicClient, id);
        if (inv.emitter.toLowerCase() !== address.toLowerCase()) continue;
        const meta = getInvoiceMeta(id);
        next.push({
          invoiceId: id,
          recipient: inv.recipient,
          amount: inv.amount,
          token: inv.token,
          status: inv.status,
          invoiceHash: inv.invoiceHash,
          emitter: inv.emitter,
          meta,
        });
      } catch {
        /* skip missing on-chain */
      }
    }
    next.sort((a, b) => (a.invoiceId < b.invoiceId ? 1 : -1));
    setRows(next);
    setLoading(false);
  }, [address, publicClient]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isVerified) router.replace('/');
  }, [isVerified, router]);

  const onCancel = async (invoiceId: bigint) => {
    if (!address) return;
    if (chainId !== arcTestnet.id) {
      try {
        await switchChainAsync({ chainId: arcTestnet.id });
      } catch {
        toast.error('Arc Testnet requis.');
        return;
      }
    }
    try {
      await writeContractAsync({
        address: invoiceRegistryContract.address,
        abi: invoiceRegistryContract.abi,
        functionName: 'cancelInvoice',
        args: [invoiceId],
        chainId: arcTestnet.id,
      });
      toast.success('Annulation envoyée.');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Annulation impossible');
    }
  };

  const exportPdf = (invoiceId: bigint) => {
    const b64 = getInvoicePdfBase64(invoiceId);
    if (!b64) {
      toast.error('PDF non stocké localement pour cette facture.');
      return;
    }
    downloadBase64Pdf(b64, `invoice-${invoiceId.toString()}.pdf`);
  };

  if (!isVerified) {
    return (
      <p className="text-center text-muted-foreground">
        <Link href="/" className="text-primary underline">
          Connectez-vous avec World ID
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Factures émises par votre wallet sur Arc Testnet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/invoice/new">Nouvelle facture</Link>
          </Button>
          <Button
            variant="outline"
            disabled={rows.length === 0}
            onClick={() => exportInvoicesCSV(rows)}
          >
            Exporter tout (CSV)
          </Button>
        </div>
      </div>

      {!isConnected ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
          Connectez votre wallet pour voir les factures liées à cette adresse.
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune facture enregistrée localement. Créez-en une ou importez les
          IDs dans le stockage.
        </p>
      ) : (
        <div className="rounded-xl border border-border/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Destinataire</TableHead>
                <TableHead>Montant (raw)</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.invoiceId.toString()}>
                  <TableCell className="font-mono text-xs">
                    #{r.invoiceId.toString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {shortAddr(r.recipient)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {r.amount.toString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {shortAddr(r.token)}
                  </TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/invoice/${r.invoiceId.toString()}`}>
                          Voir
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => exportPdf(r.invoiceId)}
                      >
                        Exporter
                      </Button>
                      {r.status === 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          disabled={isCancelPending}
                          onClick={() => void onCancel(r.invoiceId)}
                        >
                          Annuler
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
