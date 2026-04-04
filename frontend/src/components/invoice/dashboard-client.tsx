'use client';

import { DashboardHomeView } from '@/components/invoice/dashboard-home';
import { RegisterEmitterWidget } from '@/components/invoice/register-emitter-widget';
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
import { arcTestnet, switchWalletToArcTestnet } from '@/lib/arc-chain';
import { invoiceRegistryContract } from '@/lib/contract';
import { exportInvoicesCSV } from '@/lib/invoice-csv';
import { readInvoice } from '@/lib/invoice-contract';
import { formatOnvoInvoiceLabel } from '@/lib/invoice-id';
import type { InvoiceRowView } from '@/lib/invoice-types';
import {
  downloadBase64Pdf,
  getInvoiceMeta,
  getInvoicePdfBase64,
  getStoredInvoiceIds,
} from '@/lib/invoice-storage';
import { useWorldID } from '@/lib/worldid';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';

function statusBadge(status: 0 | 1 | 2, t: (key: string) => string) {
  if (status === 0)
    return (
      <Badge variant="outline" className="border-amber-500/60 text-amber-400">
        {t('invoice.status.pending')}
      </Badge>
    );
  if (status === 1)
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/60 text-emerald-400"
      >
        {t('invoice.status.paid')}
      </Badge>
    );
  return (
    <Badge variant="secondary" className="text-muted-foreground">
      {t('invoice.status.cancelled')}
    </Badge>
  );
}

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export type DashboardClientVariant = 'home' | 'invoices';

export function DashboardClient({
  variant = 'home',
}: {
  variant?: DashboardClientVariant;
}) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { authReady, isVerified } = useWorldID();
  const { address, isConnected } = useAccount();
  const publicClientArc = usePublicClient({ chainId: arcTestnet.id });
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending: isCancelPending } = useWriteContract();

  const { data: emitterVerified, refetch: refetchEmitterVerified } =
    useReadContract({
      address: invoiceRegistryContract.address,
      abi: invoiceRegistryContract.abi,
      functionName: 'isEmitterVerified',
      args: address ? [address] : undefined,
      query: { enabled: !!address && isConnected },
    });

  const [rows, setRows] = useState<InvoiceRowView[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!address || !publicClientArc) {
      setRows([]);
      setLoading(false);
      return;
    }
    const ids = getStoredInvoiceIds(address);
    const next: InvoiceRowView[] = [];
    for (const id of ids) {
      try {
        const inv = await readInvoice(publicClientArc, id);
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
  }, [address, publicClientArc]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!authReady) return;
    if (!isVerified) router.replace('/');
  }, [authReady, isVerified, router]);

  const onCancel = async (invoiceId: bigint) => {
    if (!address) return;
    try {
      await switchWalletToArcTestnet(switchChainAsync);
    } catch {
      toast.error(t('invoice.toast.arcNetworkRequired'));
      return;
    }
    try {
      await writeContractAsync({
        address: invoiceRegistryContract.address,
        abi: invoiceRegistryContract.abi,
        functionName: 'cancelInvoice',
        args: [invoiceId],
        chainId: arcTestnet.id,
        chain: arcTestnet,
      });
      toast.success(t('invoice.toast.cancelSent'));
      await load();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t('invoice.toast.cancelFailed'),
      );
    }
  };

  const exportPdf = (invoiceId: bigint) => {
    const b64 = getInvoicePdfBase64(invoiceId);
    if (!b64) {
      toast.error(t('invoice.toast.pdfNotStored'));
      return;
    }
    downloadBase64Pdf(b64, `invoice-${invoiceId.toString()}.pdf`);
  };

  if (!authReady) {
    return (
      <div
        className="min-h-[40vh] animate-pulse rounded-xl bg-muted/30"
        aria-busy
        aria-label={t('invoice.dashboard.loadingSessionAria')}
      />
    );
  }

  if (!isVerified) {
    return (
      <p className="text-center text-muted-foreground">
        <Link href="/" className="text-primary underline">
          {t('invoice.dashboard.connectWorldIdLink')}
        </Link>
      </p>
    );
  }

  const invoiceTable = loading ? (
    <p className="text-sm text-muted-foreground">
      {t('invoice.dashboard.loading')}
    </p>
  ) : rows.length === 0 ? (
    <p className="text-sm text-muted-foreground">
      {t('invoice.dashboard.emptyState')}
    </p>
  ) : (
    <div className="rounded-xl border border-border/80">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('invoice.dashboard.colId')}</TableHead>
            <TableHead>{t('invoice.dashboard.colRecipient')}</TableHead>
            <TableHead>{t('invoice.dashboard.colAmountRaw')}</TableHead>
            <TableHead>{t('invoice.dashboard.colToken')}</TableHead>
            <TableHead>{t('invoice.dashboard.colStatus')}</TableHead>
            <TableHead className="text-right">
              {t('invoice.dashboard.colActions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.invoiceId.toString()}>
              <TableCell className="font-mono text-xs">
                {formatOnvoInvoiceLabel(r.invoiceId)}
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
              <TableCell>{statusBadge(r.status, t)}</TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap justify-end gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/invoice/${r.invoiceId.toString()}`}>
                      {t('invoice.dashboard.view')}
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => exportPdf(r.invoiceId)}
                  >
                    {t('invoice.dashboard.export')}
                  </Button>
                  {r.status === 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={isCancelPending}
                      onClick={() => void onCancel(r.invoiceId)}
                    >
                      {t('invoice.dashboard.cancel')}
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const actionsRow = (
    <div className="flex flex-wrap gap-2">
      <Button asChild>
        <Link href="/invoice/new">{t('invoice.dashboard.newInvoice')}</Link>
      </Button>
      <Button
        variant="outline"
        disabled={rows.length === 0}
        onClick={() => exportInvoicesCSV(rows)}
      >
        {t('invoice.dashboard.exportAllCsv')}
      </Button>
    </div>
  );

  if (variant === 'invoices') {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {t('invoice.dashboard.subtitle')}
          </p>
          {actionsRow}
        </div>

        {!isConnected ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
            {t('invoice.dashboard.connectWalletHint')}
          </p>
        ) : null}

        {isConnected && emitterVerified === false ? (
          <RegisterEmitterWidget
            onRegistered={() => void refetchEmitterVerified()}
          />
        ) : null}

        {invoiceTable}
      </div>
    );
  }

  return (
    <DashboardHomeView
      rows={rows}
      loading={loading}
      alertsSlot={
        <>
          {!isConnected ? (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
              {t('invoice.dashboard.connectWalletHint')}
            </p>
          ) : null}
          {isConnected && emitterVerified === false ? (
            <RegisterEmitterWidget
              onRegistered={() => void refetchEmitterVerified()}
            />
          ) : null}
        </>
      }
      onExportAllCsv={() => exportInvoicesCSV(rows)}
      exportDisabled={rows.length === 0}
      onCancel={(invoiceId) => void onCancel(invoiceId)}
      onExportPdf={exportPdf}
      isCancelPending={isCancelPending}
    />
  );
}
