'use client';

import { invoiceFormSchema } from '@/components/invoice/invoice-form-schema';
import { InvoicePreviewDocument } from '@/components/invoice/invoice-preview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { invoiceRegistryContract } from '@/lib/contract';
import { computeTotalsFromLines } from '@/lib/invoice-calculations';
import type { InvoiceFormValues, InvoiceMetaRecord } from '@/lib/invoice-types';
import {
  appendInvoiceId,
  setInvoiceMeta,
  setInvoicePdfBase64,
} from '@/lib/invoice-storage';
import { getTokenAddress, tokenDecimals } from '@/lib/invoice-tokens';
import { parseInvoiceCreatedInvoiceId } from '@/lib/invoice-contract';
import {
  blobToBase64,
  generatePdfBlobFromElement,
  pdfBlobToBytes32,
} from '@/lib/pdf-utils';
import { useWorldID } from '@/lib/worldid';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { arcTestnet } from 'viem/chains';
import { isAddress, parseUnits } from 'viem';
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';

function defaultForm(): InvoiceFormValues {
  return {
    emitterName: '',
    emitterAddress: '',
    emitterSiret: '',
    emitterEmail: '',
    clientName: '',
    clientWallet: '',
    clientEmail: '',
    lines: [
      {
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-0`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        vatPercent: 20,
      },
    ],
    invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    currency: 'USDC',
    notes: '',
  };
}

export function InvoiceNewClient() {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const { authReady, isVerified } = useWorldID();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();

  const [debouncedPreview, setDebouncedPreview] =
    useState<InvoiceFormValues>(defaultForm);
  const [successId, setSuccessId] = useState<bigint | null>(null);
  const [stepSubmitting, setStepSubmitting] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: defaultForm(),
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const watched = useWatch({ control: form.control });

  useEffect(() => {
    const t = setTimeout(() => {
      const merged = { ...defaultForm(), ...watched } as InvoiceFormValues;
      if (watched?.lines?.length) {
        merged.lines = (watched.lines as InvoiceFormValues['lines']).map(
          (l) => ({
            ...l,
            vatPercent:
              typeof l.vatPercent === 'number' && !Number.isNaN(l.vatPercent)
                ? l.vatPercent
                : 20,
          }),
        );
      }
      setDebouncedPreview(merged);
    }, 300);
    return () => clearTimeout(t);
  }, [watched]);

  useEffect(() => {
    if (address) {
      form.setValue('emitterAddress', address);
    }
  }, [address, form]);

  useEffect(() => {
    if (!authReady) return;
    if (!isVerified) router.replace('/');
  }, [authReady, isVerified, router]);

  const { data: emitterVerified } = useReadContract({
    address: invoiceRegistryContract.address,
    abi: invoiceRegistryContract.abi,
    functionName: 'isEmitterVerified',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const totals = useMemo(
    () => computeTotalsFromLines(debouncedPreview.lines),
    [debouncedPreview.lines],
  );

  const onSubmit = form.handleSubmit(async (data) => {
    if (!address || !isAddress(data.clientWallet)) {
      toast.error('Connectez votre wallet et vérifiez l’adresse client.');
      return;
    }
    if (chainId !== arcTestnet.id) {
      try {
        await switchChainAsync({ chainId: arcTestnet.id });
      } catch {
        toast.error('Passez sur Arc Testnet pour continuer.');
        return;
      }
    }
    if (!emitterVerified) {
      toast.error(
        'Émetteur non vérifié on-chain — appelez registerWithWorldId sur le contrat d’abord.',
      );
      return;
    }
    const el = previewRef.current;
    if (!el) {
      toast.error('Aperçu indisponible.');
      return;
    }

    setStepSubmitting(true);
    try {
      const pdfBlob = await generatePdfBlobFromElement(el);
      const invoiceHash = await pdfBlobToBytes32(pdfBlob);
      const base64 = await blobToBase64(pdfBlob);

      const decimals = tokenDecimals();
      const amount = parseUnits(totals.totalTtc.toFixed(decimals), decimals);
      const token = getTokenAddress(data.currency);

      if (token === '0x0000000000000000000000000000000000000000') {
        toast.error(
          'Configurez NEXT_PUBLIC_TOKEN_USDC et NEXT_PUBLIC_TOKEN_EURC (Arc Testnet).',
        );
        return;
      }

      const hash = await writeContractAsync({
        address: invoiceRegistryContract.address,
        abi: invoiceRegistryContract.abi,
        functionName: 'createInvoice',
        args: [
          invoiceHash,
          address,
          data.clientWallet as `0x${string}`,
          amount,
          token,
        ],
        chainId: arcTestnet.id,
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      const newId = parseInvoiceCreatedInvoiceId(receipt);
      if (newId === undefined) {
        toast.error('Transaction OK mais invoiceId introuvable dans les logs.');
        return;
      }

      setInvoicePdfBase64(newId, base64);
      appendInvoiceId(address, newId);

      const meta: InvoiceMetaRecord = {
        invoiceId: newId.toString(),
        invoiceNumber: data.invoiceNumber,
        emitterName: data.emitterName,
        emitterAddress: data.emitterAddress,
        emitterSiret: data.emitterSiret,
        emitterEmail: data.emitterEmail,
        clientName: data.clientName,
        clientWallet: data.clientWallet,
        clientEmail: data.clientEmail,
        lines: data.lines,
        subtotal: totals.totalHt,
        totalHt: totals.totalHt,
        tvaAmount: totals.tvaAmount,
        totalTtc: totals.totalTtc,
        currency: data.currency,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        notes: data.notes,
        invoiceHash,
        createdAt: Date.now(),
      };
      setInvoiceMeta(newId, meta);

      setSuccessId(newId);
      toast.success('Facture créée on-chain.');
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : 'Échec de la création de la facture.',
      );
    } finally {
      setStepSubmitting(false);
    }
  });

  const addLine = useCallback(() => {
    append({
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${fields.length}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      vatPercent: 20,
    });
  }, [append, fields.length]);

  if (!authReady) {
    return (
      <div
        className="min-h-[40vh] animate-pulse rounded-xl bg-muted/30"
        aria-busy
        aria-label="Chargement session"
      />
    );
  }

  if (!isVerified) {
    return (
      <p className="text-center text-muted-foreground">
        Accès réservé —{' '}
        <Link href="/" className="text-primary underline">
          connectez-vous avec World ID
        </Link>
        .
      </p>
    );
  }

  if (successId !== null) {
    return (
      <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold">Facture enregistrée</h1>
        <p className="text-sm text-muted-foreground">
          Partagez le lien de paiement avec votre client.
        </p>
        <div className="rounded-lg bg-muted/50 p-4 font-mono text-sm break-all">
          {typeof window !== 'undefined'
            ? `${window.location.origin}/pay/${successId.toString()}`
            : `/pay/${successId.toString()}`}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="secondary">
            <Link href="/dashboard">Retour au dashboard</Link>
          </Button>
          <Button asChild>
            <Link href={`/pay/${successId.toString()}`}>
              Ouvrir la page paiement
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
      <form onSubmit={onSubmit} className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Nouvelle facture
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Remplissez le formulaire — l&apos;aperçu se met à jour (300 ms).
          </p>
        </div>

        {!isConnected ? (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Connectez un wallet (émetteur) pour signer la transaction.
          </p>
        ) : null}

        {isConnected && emitterVerified === false ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
            Votre adresse n&apos;est pas enregistrée comme émetteur vérifié
            on-chain. Appelez{' '}
            <code className="text-xs">registerWithWorldId</code> sur le contrat
            avant de créer une facture.
          </p>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Émetteur
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="emitterName">Nom / Raison sociale</Label>
              <Input id="emitterName" {...form.register('emitterName')} />
              {form.formState.errors.emitterName ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.emitterName.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="emitterAddress">Adresse (siège)</Label>
              <Input id="emitterAddress" {...form.register('emitterAddress')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emitterSiret">SIRET (optionnel)</Label>
              <Input id="emitterSiret" {...form.register('emitterSiret')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emitterEmail">Email</Label>
              <Input
                id="emitterEmail"
                type="email"
                {...form.register('emitterEmail')}
              />
            </div>
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Client
          </h2>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nom</Label>
              <Input id="clientName" {...form.register('clientName')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientWallet">Adresse wallet</Label>
              <Input
                id="clientWallet"
                placeholder="0x…"
                className="font-mono text-sm"
                {...form.register('clientWallet')}
              />
              {form.formState.errors.clientWallet ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.clientWallet.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email (optionnel)</Label>
              <Input
                id="clientEmail"
                type="email"
                {...form.register('clientEmail')}
              />
            </div>
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Lignes
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              + Ligne
            </Button>
          </div>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-lg border border-border/80 p-4 sm:grid-cols-12"
              >
                <div className="sm:col-span-4">
                  <Label>Description</Label>
                  <Input
                    {...form.register(`lines.${index}.description` as const)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Qté</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register(`lines.${index}.quantity` as const)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>P.U. HT</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register(`lines.${index}.unitPrice` as const)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>TVA %</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    {...form.register(`lines.${index}.vatPercent`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="flex items-end sm:col-span-2">
                  {fields.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => remove(index)}
                    >
                      Retirer
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Devise (stablecoin)</Label>
            <Select
              value={form.watch('currency')}
              onValueChange={(v) =>
                form.setValue('currency', v as InvoiceFormValues['currency'])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USDC">USDC</SelectItem>
                <SelectItem value="EURC">EURC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">N° facture</Label>
            <Input id="invoiceNumber" {...form.register('invoiceNumber')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issueDate">Date d&apos;émission</Label>
            <Input id="issueDate" type="date" {...form.register('issueDate')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Échéance</Label>
            <Input id="dueDate" type="date" {...form.register('dueDate')} />
          </div>
        </section>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optionnel)</Label>
          <Textarea id="notes" rows={3} {...form.register('notes')} />
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
          <p className="font-medium">Résumé</p>
          <p className="mt-2 text-muted-foreground">
            Total HT : {totals.totalHt.toFixed(2)} — TVA :{' '}
            {totals.tvaAmount.toFixed(2)} —{' '}
            <span className="font-semibold text-foreground">
              Total TTC : {totals.totalTtc.toFixed(2)}
            </span>
          </p>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto"
          disabled={
            stepSubmitting ||
            isWritePending ||
            !isConnected ||
            emitterVerified === false
          }
        >
          {stepSubmitting || isWritePending
            ? 'Transaction…'
            : 'Générer la facture'}
        </Button>
      </form>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">
          Aperçu
        </p>
        <InvoicePreviewDocument
          values={debouncedPreview}
          previewRef={previewRef}
        />
      </div>
    </div>
  );
}
