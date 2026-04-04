'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { readInvoice } from '@/lib/invoice-contract';
import {
  downloadBase64Pdf,
  getInvoiceMeta,
  getInvoicePdfBase64,
} from '@/lib/invoice-storage';
import { useWorldID } from '@/lib/worldid';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePublicClient } from 'wagmi';

function statusLabel(s: 0 | 1 | 2) {
  if (s === 0) return 'PENDING';
  if (s === 1) return 'PAID';
  return 'CANCELLED';
}

export function InvoiceDetailClient() {
  const router = useRouter();
  const params = useParams();
  const idStr = typeof params.id === 'string' ? params.id : '';
  const invoiceId = idStr ? BigInt(idStr) : undefined;

  const { isVerified } = useWorldID();
  const publicClient = usePublicClient();
  const [data, setData] = useState<Awaited<
    ReturnType<typeof readInvoice>
  > | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId || !publicClient) {
      setLoading(false);
      return;
    }
    void readInvoice(publicClient, invoiceId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [invoiceId, publicClient]);

  const meta = invoiceId ? getInvoiceMeta(invoiceId) : null;

  useEffect(() => {
    if (!isVerified) router.replace('/');
  }, [isVerified, router]);

  if (!isVerified) {
    return (
      <p className="text-muted-foreground">
        <Link href="/" className="text-primary underline">
          World ID requis
        </Link>
      </p>
    );
  }

  if (!invoiceId) {
    return <p className="text-destructive">ID invalide.</p>;
  }

  if (loading) return <p className="text-muted-foreground">Chargement…</p>;

  if (!data) {
    return (
      <p className="text-muted-foreground">
        Facture introuvable on-chain (ou réseau incorrect).
      </p>
    );
  }

  const pdf = getInvoicePdfBase64(invoiceId);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Facture</p>
          <h1 className="text-2xl font-semibold">#{invoiceId.toString()}</h1>
        </div>
        <Badge variant="outline">{statusLabel(data.status)}</Badge>
      </div>

      <dl className="grid gap-4 rounded-xl border border-border/80 bg-card/50 p-6 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Hash PDF</dt>
          <dd className="mt-1 break-all font-mono text-xs">
            {data.invoiceHash}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Émetteur</dt>
          <dd className="mt-1 font-mono text-xs">{data.emitter}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Destinataire</dt>
          <dd className="mt-1 font-mono text-xs">{data.recipient}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Montant (wei smallest)</dt>
          <dd className="mt-1 font-mono text-xs">{data.amount.toString()}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Token</dt>
          <dd className="mt-1 font-mono text-xs">{data.token}</dd>
        </div>
        {meta ? (
          <>
            <div>
              <dt className="text-muted-foreground">N° pièce</dt>
              <dd className="mt-1">{meta.invoiceNumber}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Client</dt>
              <dd className="mt-1">{meta.clientName}</dd>
            </div>
          </>
        ) : null}
      </dl>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <Button asChild>
          <Link href={`/pay/${invoiceId.toString()}`}>Page paiement</Link>
        </Button>
        {pdf ? (
          <Button
            variant="outline"
            onClick={() => {
              downloadBase64Pdf(pdf, `invoice-${invoiceId.toString()}.pdf`);
              toast.success('Téléchargement démarré.');
            }}
          >
            Télécharger PDF
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            PDF non disponible en local.
          </p>
        )}
      </div>
    </div>
  );
}
