'use client';

import { createInvoiceFormSchema } from '@/components/invoice/invoice-form-schema';
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
import { arcTestnet, switchWalletToArcTestnet } from '@/lib/arc-chain';
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
import { formatOnvoInvoiceLabel } from '@/lib/invoice-id';
import {
  blobToBase64,
  generatePdfBlobFromElement,
  pdfBlobToBytes32,
} from '@/lib/pdf-utils';
import { registerEmitterOnChain } from '@/lib/register-emitter-onchain';
import {
  extractNullifierFromIdKitResult,
  fetchRpContext,
  useWorldID,
  verifyProof,
  WORLD_ID_CONFIG,
} from '@/lib/worldid';
import type { IDKitResult, RpContext } from '@worldcoin/idkit';
import { IDKitRequestWidget, orbLegacy } from '@worldcoin/idkit';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { parseUnits, zeroAddress } from 'viem';
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';

function defaultForm(): InvoiceFormValues {
  return {
    emitterName: '',
    emitterStreet: '',
    emitterStreetLine2: '',
    emitterPostalCode: '',
    emitterCity: '',
    emitterCountry: '',
    emitterSiret: '',
    emitterEmail: '',
    clientName: '',
    clientStreet: '',
    clientStreetLine2: '',
    clientPostalCode: '',
    clientCity: '',
    clientCountry: '',
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
    invoiceNumber: '',
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    currency: 'USDC',
    notes: '',
  };
}

export function InvoiceNewClient() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const {
    authReady,
    isVerified,
    nullifier: sessionWorldIdNullifier,
  } = useWorldID();
  const { address, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const publicClientArc = usePublicClient({ chainId: arcTestnet.id });
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();

  const [debouncedPreview, setDebouncedPreview] =
    useState<InvoiceFormValues>(defaultForm);
  const [successId, setSuccessId] = useState<bigint | null>(null);
  const [stepSubmitting, setStepSubmitting] = useState(false);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [idKitOpen, setIdKitOpen] = useState(false);
  const [loadingRpForSubmit, setLoadingRpForSubmit] = useState(false);
  /** Nullifier issu du dernier IDKit (première facture) — appliqué au preview PDF avant capture. */
  const [idKitWorldIdNullifier, setIdKitWorldIdNullifier] = useState<
    string | null
  >(null);
  const pendingFormDataRef = useRef<InvoiceFormValues | null>(null);

  const invoiceFormSchema = useMemo(() => createInvoiceFormSchema(t), [t]);

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
  const issueDateWatched = useWatch({
    control: form.control,
    name: 'issueDate',
  });

  const registryDeployed =
    invoiceRegistryContract.address.toLowerCase() !== zeroAddress.toLowerCase();

  const nextIdArgs = useMemo(() => {
    if (!address || !issueDateWatched?.trim()) return undefined;
    const d = new Date(issueDateWatched);
    if (Number.isNaN(d.getTime())) return undefined;
    return [
      address,
      BigInt(d.getFullYear()),
      BigInt(d.getMonth() + 1),
    ] as const;
  }, [address, issueDateWatched]);

  const {
    data: nextPackedInvoiceId,
    isPending: isNextInvoiceIdPending,
    isFetching: isNextInvoiceIdFetching,
    isError: isNextInvoiceIdError,
  } = useReadContract({
    chainId: arcTestnet.id,
    address: invoiceRegistryContract.address,
    abi: invoiceRegistryContract.abi,
    functionName: 'getNextInvoiceId',
    args: nextIdArgs,
    query: {
      enabled: Boolean(
        registryDeployed && nextIdArgs && isConnected && publicClientArc,
      ),
    },
  });

  const nextInvoiceFromChainLoading =
    registryDeployed &&
    !!nextIdArgs &&
    (isNextInvoiceIdPending || isNextInvoiceIdFetching) &&
    !isNextInvoiceIdError;

  useEffect(() => {
    if (typeof nextPackedInvoiceId !== 'bigint') return;
    const label = formatOnvoInvoiceLabel(nextPackedInvoiceId);
    form.setValue('invoiceNumber', label, {
      shouldValidate: true,
      shouldDirty: false,
    });
  }, [nextPackedInvoiceId, form]);

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
    if (!authReady) return;
    if (!isVerified) router.replace('/');
  }, [authReady, isVerified, router]);

  const { data: emitterVerified, refetch: refetchEmitterVerified } =
    useReadContract({
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

  const previewWorldIdNullifier =
    idKitWorldIdNullifier?.trim() || sessionWorldIdNullifier?.trim() || null;

  const createInvoiceFromVerifiedForm = useCallback(
    async (
      data: InvoiceFormValues,
      worldIdNullifierOverride?: string | null,
    ) => {
      if (!address) {
        toast.error(t('invoice.toast.walletIssuerRequired'));
        return;
      }
      try {
        await switchWalletToArcTestnet(switchChainAsync);
      } catch {
        toast.error(t('invoice.toast.arcNetworkRequired'));
        return;
      }
      const el = previewRef.current;
      if (!el) {
        toast.error(t('invoice.toast.previewUnavailable'));
        return;
      }

      const emitterWorldIdForDoc =
        worldIdNullifierOverride?.trim() ||
        sessionWorldIdNullifier?.trim() ||
        undefined;

      const lineTotals = computeTotalsFromLines(data.lines);

      setStepSubmitting(true);
      try {
        const pdfBlob = await generatePdfBlobFromElement(el);
        const invoiceHash = await pdfBlobToBytes32(pdfBlob);
        const base64 = await blobToBase64(pdfBlob);

        const decimals = tokenDecimals();
        const amount = parseUnits(
          lineTotals.totalTtc.toFixed(decimals),
          decimals,
        );
        const token = getTokenAddress(data.currency);

        if (token === '0x0000000000000000000000000000000000000000') {
          toast.error(t('invoice.toast.tokenEnv'));
          return;
        }

        const issue = new Date(data.issueDate);
        const invYear = BigInt(issue.getFullYear());
        const invMonth = BigInt(issue.getMonth() + 1);

        const nextInvoiceId = await publicClientArc!.readContract({
          address: invoiceRegistryContract.address,
          abi: invoiceRegistryContract.abi,
          functionName: 'getNextInvoiceId',
          args: [address, invYear, invMonth],
        });

        // `recipient` must be non-zero on-chain ; payment still settles to the emitter.
        const onChainRecipient = address;

        const hash = await writeContractAsync({
          address: invoiceRegistryContract.address,
          abi: invoiceRegistryContract.abi,
          functionName: 'createInvoice',
          args: [
            nextInvoiceId,
            invoiceHash,
            address,
            onChainRecipient,
            amount,
            token,
            invYear,
            invMonth,
          ],
          chainId: arcTestnet.id,
          chain: arcTestnet,
        });

        const receipt = await publicClientArc!.waitForTransactionReceipt({
          hash,
        });
        const newId = parseInvoiceCreatedInvoiceId(receipt);
        if (newId === undefined) {
          toast.error(t('invoice.toast.receiptNoId'));
          return;
        }

        setInvoicePdfBase64(newId, base64);
        appendInvoiceId(address, newId);

        const meta: InvoiceMetaRecord = {
          invoiceId: newId.toString(),
          invoiceNumber: data.invoiceNumber,
          emitterName: data.emitterName,
          emitterStreet: data.emitterStreet,
          emitterStreetLine2: data.emitterStreetLine2,
          emitterPostalCode: data.emitterPostalCode,
          emitterCity: data.emitterCity,
          emitterCountry: data.emitterCountry,
          emitterSiret: data.emitterSiret,
          emitterEmail: data.emitterEmail,
          ...(emitterWorldIdForDoc
            ? { emitterWorldIdNullifier: emitterWorldIdForDoc }
            : {}),
          clientName: data.clientName,
          clientStreet: data.clientStreet,
          clientStreetLine2: data.clientStreetLine2,
          clientPostalCode: data.clientPostalCode,
          clientCity: data.clientCity,
          clientCountry: data.clientCountry,
          clientEmail: data.clientEmail,
          lines: data.lines,
          subtotal: lineTotals.totalHt,
          totalHt: lineTotals.totalHt,
          tvaAmount: lineTotals.tvaAmount,
          totalTtc: lineTotals.totalTtc,
          currency: data.currency,
          issueDate: data.issueDate,
          dueDate: data.dueDate,
          notes: data.notes,
          invoiceHash,
          createdAt: Date.now(),
        };
        setInvoiceMeta(newId, meta);

        setSuccessId(newId);
        toast.success(t('invoice.toast.invoiceCreated'));
      } catch (e) {
        console.error(e);
        toast.error(
          e instanceof Error
            ? e.message
            : t('invoice.toast.invoiceCreateFailed'),
        );
      } finally {
        setIdKitWorldIdNullifier(null);
        setStepSubmitting(false);
      }
    },
    [
      address,
      publicClientArc,
      sessionWorldIdNullifier,
      switchChainAsync,
      t,
      writeContractAsync,
    ],
  );

  const handleVerifyForInvoice = useCallback(
    async (result: IDKitResult) => {
      const ok = await verifyProof(result);
      if (!ok) throw new Error(t('invoice.toast.worldIdRejected'));
    },
    [t],
  );

  const handleRegisterSuccessFromSubmit = useCallback(
    async (result: IDKitResult) => {
      if (!address) {
        toast.error(t('invoice.toast.walletRequiredShort'));
        pendingFormDataRef.current = null;
        setIdKitOpen(false);
        return;
      }
      const data = pendingFormDataRef.current;
      if (!data) {
        setIdKitOpen(false);
        return;
      }
      try {
        await registerEmitterOnChain(result, {
          switchChainAsync,
          writeContractAsync,
          publicClientArc,
        });
        await refetchEmitterVerified();
        const kitNullifier = extractNullifierFromIdKitResult(result).trim();
        flushSync(() => {
          setIdKitWorldIdNullifier(kitNullifier || null);
        });
        pendingFormDataRef.current = null;
        setIdKitOpen(false);
        await createInvoiceFromVerifiedForm(
          data,
          kitNullifier || sessionWorldIdNullifier,
        );
      } catch (e) {
        console.error(e);
        toast.error(
          e instanceof Error
            ? e.message
            : t('invoice.toast.emitterOrInvoiceFailed'),
        );
        pendingFormDataRef.current = null;
        setIdKitOpen(false);
      }
    },
    [
      address,
      createInvoiceFromVerifiedForm,
      publicClientArc,
      refetchEmitterVerified,
      sessionWorldIdNullifier,
      switchChainAsync,
      t,
      writeContractAsync,
    ],
  );

  const onSubmit = form.handleSubmit(async (data) => {
    if (!address) {
      toast.error(t('invoice.toast.walletIssuerRequired'));
      return;
    }

    if (address && emitterVerified === undefined) {
      toast.error(t('invoice.toast.verifyingOnChain'));
      return;
    }

    if (emitterVerified === false) {
      pendingFormDataRef.current = data;
      setLoadingRpForSubmit(true);
      try {
        const ctx = await fetchRpContext();
        setRpContext(ctx);
        setIdKitOpen(true);
      } catch {
        toast.error(t('invoice.toast.worldIdInitRp'));
        pendingFormDataRef.current = null;
      } finally {
        setLoadingRpForSubmit(false);
      }
      return;
    }

    await createInvoiceFromVerifiedForm(data);
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
        aria-label={t('invoice.detail.loadingSessionAria')}
      />
    );
  }

  if (!isVerified) {
    return (
      <p className="text-center text-muted-foreground">
        {t('invoice.form.accessDenied')}{' '}
        <Link href="/" className="text-primary underline">
          {t('invoice.form.accessDeniedLink')}
        </Link>
        {t('invoice.form.accessDeniedSuffix')}
      </p>
    );
  }

  if (successId !== null) {
    return (
      <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold">
          {t('invoice.form.successTitle')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('invoice.form.successSubtitle')}
        </p>
        <p className="font-mono text-sm text-foreground">
          {formatOnvoInvoiceLabel(successId)}
        </p>
        <div className="rounded-lg bg-muted/50 p-4 font-mono text-sm break-all">
          {typeof window !== 'undefined'
            ? `${window.location.origin}/pay/${successId.toString()}`
            : `/pay/${successId.toString()}`}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="secondary">
            <Link href="/dashboard">{t('invoice.form.backDashboard')}</Link>
          </Button>
          <Button asChild>
            <Link href={`/pay/${successId.toString()}`}>
              {t('invoice.form.openPayPage')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <form onSubmit={onSubmit} className="space-y-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('invoice.form.title')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('invoice.form.subtitle')}
            </p>
          </div>

          {!isConnected ? (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {t('invoice.form.walletConnectHint')}
            </p>
          ) : null}

          {isConnected && emitterVerified === false ? (
            <p className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              {t('invoice.form.firstInvoiceHint')}
            </p>
          ) : null}

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t('invoice.form.sectionEmitter')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="emitterName">
                  {t('invoice.form.emitterName')}
                </Label>
                <Input id="emitterName" {...form.register('emitterName')} />
                {form.formState.errors.emitterName ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.emitterName.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="emitterStreet">
                  {t('invoice.form.emitterStreet')}
                </Label>
                <Input
                  id="emitterStreet"
                  placeholder={t('invoice.form.emitterStreetPlaceholder')}
                  {...form.register('emitterStreet')}
                />
                {form.formState.errors.emitterStreet ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.emitterStreet.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="emitterStreetLine2">
                  {t('invoice.form.emitterStreetLine2')}
                </Label>
                <Input
                  id="emitterStreetLine2"
                  placeholder={t('invoice.form.emitterStreetLine2Placeholder')}
                  {...form.register('emitterStreetLine2')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emitterPostalCode">
                  {t('invoice.form.emitterPostalCode')}
                </Label>
                <Input
                  id="emitterPostalCode"
                  autoComplete="postal-code"
                  {...form.register('emitterPostalCode')}
                />
                {form.formState.errors.emitterPostalCode ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.emitterPostalCode.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="emitterCity">
                  {t('invoice.form.emitterCity')}
                </Label>
                <Input
                  id="emitterCity"
                  autoComplete="address-level2"
                  {...form.register('emitterCity')}
                />
                {form.formState.errors.emitterCity ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.emitterCity.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="emitterCountry">
                  {t('invoice.form.emitterCountry')}
                </Label>
                <Input
                  id="emitterCountry"
                  autoComplete="country-name"
                  placeholder={t('invoice.form.emitterCountryPlaceholder')}
                  {...form.register('emitterCountry')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emitterSiret">
                  {t('invoice.form.emitterSiretOptional')}
                </Label>
                <Input id="emitterSiret" {...form.register('emitterSiret')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emitterEmail">
                  {t('invoice.form.emitterEmail')}
                </Label>
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
              {t('invoice.form.sectionClient')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="clientName">
                  {t('invoice.form.clientName')}
                </Label>
                <Input id="clientName" {...form.register('clientName')} />
                {form.formState.errors.clientName ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.clientName.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="clientStreet">
                  {t('invoice.form.clientStreet')}
                </Label>
                <Input
                  id="clientStreet"
                  placeholder={t('invoice.form.clientStreetPlaceholder')}
                  {...form.register('clientStreet')}
                />
                {form.formState.errors.clientStreet ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.clientStreet.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="clientStreetLine2">
                  {t('invoice.form.clientStreetLine2')}
                </Label>
                <Input
                  id="clientStreetLine2"
                  placeholder={t('invoice.form.clientStreetLine2Placeholder')}
                  {...form.register('clientStreetLine2')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPostalCode">
                  {t('invoice.form.clientPostalCode')}
                </Label>
                <Input
                  id="clientPostalCode"
                  autoComplete="postal-code"
                  {...form.register('clientPostalCode')}
                />
                {form.formState.errors.clientPostalCode ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.clientPostalCode.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientCity">
                  {t('invoice.form.clientCity')}
                </Label>
                <Input
                  id="clientCity"
                  autoComplete="address-level2"
                  {...form.register('clientCity')}
                />
                {form.formState.errors.clientCity ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.clientCity.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="clientCountry">
                  {t('invoice.form.clientCountry')}
                </Label>
                <Input
                  id="clientCountry"
                  autoComplete="country-name"
                  placeholder={t('invoice.form.clientCountryPlaceholder')}
                  {...form.register('clientCountry')}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="clientEmail">
                  {t('invoice.form.clientEmailOptional')}
                </Label>
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
                {t('invoice.form.sectionLines')}
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLine}
              >
                {t('invoice.form.addLine')}
              </Button>
            </div>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-lg border border-border/80 p-4 sm:grid-cols-12"
                >
                  <div className="sm:col-span-4">
                    <Label>{t('invoice.form.description')}</Label>
                    <Input
                      {...form.register(`lines.${index}.description` as const)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{t('invoice.form.qty')}</Label>
                    <Input
                      type="number"
                      step={1}
                      {...form.register(`lines.${index}.quantity` as const)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{t('invoice.form.unitPriceHt')}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register(`lines.${index}.unitPrice` as const)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{t('invoice.form.vatPercent')}</Label>
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
                        {t('invoice.form.removeLine')}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('invoice.form.currency')}</Label>
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
              <Label htmlFor="invoiceNumber">
                {t('invoice.form.invoiceNumber')}
              </Label>
              <Input
                id="invoiceNumber"
                placeholder={t('invoice.form.invoiceNumberPlaceholder')}
                readOnly={nextInvoiceFromChainLoading}
                aria-busy={nextInvoiceFromChainLoading}
                {...form.register('invoiceNumber')}
              />
              {nextInvoiceFromChainLoading ? (
                <p className="text-xs text-muted-foreground">
                  {t('invoice.form.invoiceNumberLoading')}
                </p>
              ) : null}
              {registryDeployed &&
              nextIdArgs &&
              !nextInvoiceFromChainLoading &&
              isNextInvoiceIdError ? (
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  {t('invoice.form.invoiceNumberChainError')}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="issueDate">{t('invoice.form.issueDate')}</Label>
              <Input
                id="issueDate"
                type="date"
                {...form.register('issueDate')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">{t('invoice.form.dueDate')}</Label>
              <Input id="dueDate" type="date" {...form.register('dueDate')} />
            </div>
          </section>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('invoice.form.notesOptional')}</Label>
            <Textarea id="notes" rows={3} {...form.register('notes')} />
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
            <p className="font-medium">{t('invoice.form.summary')}</p>
            <p className="mt-2 text-muted-foreground">
              {t('invoice.form.summaryLine', {
                ht: totals.totalHt.toFixed(2),
                vat: totals.tvaAmount.toFixed(2),
                ttc: totals.totalTtc.toFixed(2),
              })}
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto"
            disabled={
              stepSubmitting ||
              isWritePending ||
              loadingRpForSubmit ||
              !isConnected ||
              (address !== undefined && emitterVerified === undefined) ||
              nextInvoiceFromChainLoading
            }
          >
            {loadingRpForSubmit
              ? t('invoice.form.submitPreparingWorldId')
              : stepSubmitting || isWritePending
                ? t('invoice.form.submitTransaction')
                : t('invoice.form.submitGenerate')}
          </Button>
        </form>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">
            {t('invoice.form.previewLabel')}
          </p>
          <InvoicePreviewDocument
            values={debouncedPreview}
            previewRef={previewRef}
            emitterWorldIdNullifier={previewWorldIdNullifier}
          />
        </div>
      </div>

      {rpContext && address ? (
        <IDKitRequestWidget
          open={idKitOpen}
          onOpenChange={(open) => {
            setIdKitOpen(open);
            if (!open) pendingFormDataRef.current = null;
          }}
          app_id={WORLD_ID_CONFIG.app_id}
          action={WORLD_ID_CONFIG.action}
          rp_context={rpContext}
          allow_legacy_proofs={true}
          preset={orbLegacy({ signal: address })}
          environment={WORLD_ID_CONFIG.environment}
          handleVerify={handleVerifyForInvoice}
          onSuccess={(r) => void handleRegisterSuccessFromSubmit(r)}
          onError={() => {
            toast.error(t('invoice.toast.worldIdCancelled'));
            pendingFormDataRef.current = null;
            setIdKitOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
