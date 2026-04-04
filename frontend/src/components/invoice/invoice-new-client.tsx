'use client';

import { createInvoiceFormSchema } from '@/components/invoice/invoice-form-schema';
import {
  InvoicePreviewDocument,
  type InvoiceDraftDocumentNo,
} from '@/components/invoice/invoice-preview';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RequiredFieldMark } from '@/components/ui/required-field-mark';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { arcTestnet } from '@/lib/arc-chain';
import { invoiceRegistryContract } from '@/lib/contract';
import { computeTotalsFromLines } from '@/lib/invoice-calculations';
import { parseInvoiceCreatedInvoiceId } from '@/lib/invoice-contract';
import { formatOnvoInvoiceLabel } from '@/lib/invoice-id';
import {
  appendInvoiceId,
  setInvoiceMeta,
  setInvoicePdfBase64,
} from '@/lib/invoice-storage';
import { getTokenAddress, tokenDecimals } from '@/lib/invoice-tokens';
import type { InvoiceFormValues, InvoiceMetaRecord } from '@/lib/invoice-types';
import {
  blobToBase64,
  generateInvoicePdf,
  pdfBlobToBytes32,
} from '@/lib/pdf-utils';
import {
  extractNullifierFromIdKitResult,
  fetchRpContext,
  useWorldID,
  verifyProof,
  WORLD_ID_CONFIG,
} from '@/lib/worldid';
import { zodResolver } from '@hookform/resolvers/zod';
import type { IDKitResult, RpContext } from '@worldcoin/idkit';
import { IDKitRequestWidget, orbLegacy } from '@worldcoin/idkit';
import { addDays, format } from 'date-fns';
import { Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { flushSync } from 'react-dom';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { parseUnits, zeroAddress } from 'viem';
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';

function parseWorldIdNullifierToBigInt(
  s: string | null | undefined,
): bigint | null {
  const t = s?.trim();
  if (!t) return null;
  try {
    if (t.startsWith('0x') || t.startsWith('0X')) return BigInt(t);
    return BigInt(t);
  } catch {
    return null;
  }
}

function defaultForm(): InvoiceFormValues {
  return {
    emitterName: '',
    emitterStreet: '',
    emitterStreetLine2: '',
    emitterPostalCode: '',
    emitterCity: '',
    emitterCountry: '',
    emitterSiret: '',
    emitterVatNumber: '',
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
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    currency: 'USDC',
    notes: '',
  };
}

const IS_DEV = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

const INVOICE_TABS = ['issuer', 'client', 'items'] as const;
type InvoiceTab = (typeof INVOICE_TABS)[number];
const INVOICE_TAB_LAST = INVOICE_TABS.length - 1;

const INVOICE_FIELD_TO_TAB: Record<string, InvoiceTab> = {
  emitterName: 'issuer',
  emitterStreet: 'issuer',
  emitterStreetLine2: 'issuer',
  emitterPostalCode: 'issuer',
  emitterCity: 'issuer',
  emitterCountry: 'issuer',
  emitterSiret: 'issuer',
  emitterVatNumber: 'issuer',
  emitterEmail: 'issuer',
  clientName: 'client',
  clientStreet: 'client',
  clientStreetLine2: 'client',
  clientPostalCode: 'client',
  clientCity: 'client',
  clientCountry: 'client',
  clientEmail: 'client',
  lines: 'items',
  issueDate: 'items',
  dueDate: 'items',
  currency: 'items',
  notes: 'items',
};

function devSampleForm(): InvoiceFormValues {
  const uid = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  return {
    emitterName: 'Onvo Labs SAS',
    emitterStreet: '42 Rue de la Croisette',
    emitterStreetLine2: 'Bâtiment B, 3e étage',
    emitterPostalCode: '06400',
    emitterCity: 'Cannes',
    emitterCountry: 'France',
    emitterSiret: '123 456 789 00012',
    emitterVatNumber: 'FR85939527636',
    emitterEmail: 'billing@onvo.dev',
    clientName: 'Client Digital SAS',
    clientStreet: '15 Avenue des Champs-Élysées',
    clientStreetLine2: '',
    clientPostalCode: '75008',
    clientCity: 'Paris',
    clientCountry: 'France',
    clientEmail: 'finance@client-digital.fr',
    lines: [
      {
        id: uid(),
        description: 'Smart contract audit',
        quantity: 3,
        unitPrice: 450,
        vatPercent: 20,
      },
      {
        id: uid(),
        description: 'Frontend integration',
        quantity: 5,
        unitPrice: 380,
        vatPercent: 20,
      },
      {
        id: uid(),
        description: 'Deployment & DevOps',
        quantity: 1,
        unitPrice: 600,
        vatPercent: 20,
      },
    ],
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    currency: 'EURC',
    notes: 'Payment due within 30 days. Thank you for your business.',
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
  const registryChainId = invoiceRegistryContract.chainId ?? arcTestnet.id;
  const publicClientArc = usePublicClient({ chainId: registryChainId });
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();

  const [debouncedPreview, setDebouncedPreview] =
    useState<InvoiceFormValues>(defaultForm);
  const [successId, setSuccessId] = useState<bigint | null>(null);
  const [stepSubmitting, setStepSubmitting] = useState(false);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [idKitOpen, setIdKitOpen] = useState(false);
  const [loadingRpForSubmit, setLoadingRpForSubmit] = useState(false);
  const [idKitWorldIdNullifier, setIdKitWorldIdNullifier] = useState<
    string | null
  >(null);
  const [firstInvoiceHintDismissed, setFirstInvoiceHintDismissed] =
    useState(false);
  const pendingFormDataRef = useRef<InvoiceFormValues | null>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const stepIndexRef = useRef(0);
  stepIndexRef.current = stepIndex;
  const activeTab = INVOICE_TABS[stepIndex] ?? INVOICE_TABS[0];

  useEffect(() => {
    setFirstInvoiceHintDismissed(false);
  }, [address]);

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
  const registryDeployed =
    invoiceRegistryContract.address.toLowerCase() !== zeroAddress.toLowerCase();

  const worldIdNullifierBn = useMemo(() => {
    const s =
      idKitWorldIdNullifier?.trim() || sessionWorldIdNullifier?.trim() || null;
    return parseWorldIdNullifierToBigInt(s);
  }, [idKitWorldIdNullifier, sessionWorldIdNullifier]);

  const nextIdArgs = useMemo(() => {
    if (!address) return undefined;
    return [address] as const;
  }, [address]);

  const {
    data: nextPackedInvoiceId,
    isError: isNextInvoiceIdError,
    error: nextInvoiceIdError,
  } = useReadContract({
    chainId: invoiceRegistryContract.chainId,
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

  useEffect(() => {
    if (nextInvoiceIdError) {
      console.error(
        '[InvoiceNew] getNextInvoiceId read failed:',
        nextInvoiceIdError,
      );
    }
  }, [nextInvoiceIdError]);

  const draftDocumentNo = useMemo((): InvoiceDraftDocumentNo => {
    if (!registryDeployed || !nextIdArgs) {
      return { kind: 'chainUnavailable' };
    }
    if (isNextInvoiceIdError) {
      return { kind: 'chainError' };
    }
    if (typeof nextPackedInvoiceId === 'bigint') {
      return {
        kind: 'chain',
        label: formatOnvoInvoiceLabel(nextPackedInvoiceId),
      };
    }
    return { kind: 'chainLoading' };
  }, [registryDeployed, nextIdArgs, isNextInvoiceIdError, nextPackedInvoiceId]);

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
        await switchChainAsync({ chainId: registryChainId });
      } catch {
        toast.error(t('invoice.toast.arcNetworkRequired'));
        return;
      }
      const emitterWorldIdForDoc =
        worldIdNullifierOverride?.trim() ||
        sessionWorldIdNullifier?.trim() ||
        undefined;

      const nullifierBn = parseWorldIdNullifierToBigInt(
        worldIdNullifierOverride ?? sessionWorldIdNullifier,
      );
      if (nullifierBn === null) {
        toast.error(t('invoice.toast.worldIdRequiredForInvoiceId'));
        return;
      }

      const lineTotals = computeTotalsFromLines(data.lines);

      setStepSubmitting(true);
      try {
        const nextInvoiceId = (await publicClientArc!.readContract({
          address: invoiceRegistryContract.address,
          abi: invoiceRegistryContract.abi,
          functionName: 'getNextInvoiceId',
          args: [address],
        })) as bigint;
        const documentLabel = formatOnvoInvoiceLabel(nextInvoiceId);

        const pdfBlob = await generateInvoicePdf(
          data,
          emitterWorldIdForDoc,
          documentLabel,
        );
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

        const onChainRecipient = address;
        const vatNumberOnChain = data.emitterVatNumber.trim().slice(0, 64);

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
            vatNumberOnChain,
            nullifierBn,
          ],
          chainId: registryChainId,
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
        appendInvoiceId(address, newId, emitterWorldIdForDoc ?? null);

        const meta: InvoiceMetaRecord = {
          invoiceId: newId.toString(),
          invoiceNumber: formatOnvoInvoiceLabel(newId),
          emitterName: data.emitterName,
          emitterStreet: data.emitterStreet,
          emitterStreetLine2: data.emitterStreetLine2,
          emitterPostalCode: data.emitterPostalCode,
          emitterCity: data.emitterCity,
          emitterCountry: data.emitterCountry,
          emitterSiret: data.emitterSiret,
          emitterVatNumber: data.emitterVatNumber.trim(),
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

        const label = formatOnvoInvoiceLabel(newId);
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${label}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        toast.success(t('invoice.toast.invoiceCreated'));
      } catch (e) {
        console.error(e);
        toast.error(
          e instanceof Error
            ? e.message
            : t('invoice.toast.invoiceCreateFailed'),
        );
      } finally {
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

  const handleIdKitSuccessFromSubmit = useCallback(
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
    [address, createInvoiceFromVerifiedForm, sessionWorldIdNullifier, t],
  );

  const submitInvoice = form.handleSubmit(
    async (data) => {
      if (!address) {
        toast.error(t('invoice.toast.walletIssuerRequired'));
        return;
      }

      if (worldIdNullifierBn === null) {
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
    },
    (errors) => {
      const tab = INVOICE_FIELD_TO_TAB[Object.keys(errors)[0] ?? ''];
      if (tab) {
        const i = INVOICE_TABS.indexOf(tab);
        if (i >= 0) setStepIndex(i);
      }
      toast.error(t('invoice.toast.formValidationError'));
    },
  );

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const s = stepIndexRef.current;
    if (s < INVOICE_TAB_LAST) setStepIndex(s + 1);
    else void submitInvoice();
  };

  const fillDevData = useCallback(() => {
    const sample = devSampleForm();
    form.reset(sample);
    toast.success('Dev: form autofilled with sample data');
  }, [form]);

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
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4">
          {isConnected &&
          worldIdNullifierBn === null &&
          !firstInvoiceHintDismissed ? (
            <Alert
              className="shrink-0 border-primary/25 bg-primary/5 py-3 text-muted-foreground"
              onDismiss={() => setFirstInvoiceHintDismissed(true)}
              dismissLabel={t('invoice.form.dismissAlert')}
            >
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs leading-relaxed sm:text-sm">
                {t('invoice.form.firstInvoiceHint')}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex min-h-0 min-w-0 flex-1 flex-row gap-4">
            {/* ── Left panel: tabbed form (40% ≥ lg) ── */}
            <div className="flex min-h-0 w-full min-w-0 flex-col lg:flex-[2]">
              {!isConnected ? (
                <p className="mx-5 mt-4 shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  {t('invoice.form.walletConnectHint')}
                </p>
              ) : null}

            {isConnected && worldIdNullifierBn === null ? (
              <p className="mx-5 mt-4 shrink-0 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                {t('invoice.form.firstInvoiceHint')}
              </p>
            ) : null}

              <form
                onSubmit={handleFormSubmit}
                className="flex min-h-0 flex-1 flex-col"
              >
              <Tabs
                value={activeTab}
                onValueChange={(v) =>
                  setStepIndex(INVOICE_TABS.indexOf(v as InvoiceTab))
                }
                className="flex min-h-0 flex-1 flex-col"
              >
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
                    {/* ── Tab: Issuer ── */}
                    <TabsContent value="issuer" className="mt-4 space-y-4">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="emitterName">
                            {t('invoice.form.emitterName')}
                            <RequiredFieldMark />
                          </Label>
                          <Input
                            id="emitterName"
                            aria-required
                            {...form.register('emitterName')}
                          />
                          {form.formState.errors.emitterName ? (
                            <p className="text-xs text-destructive">
                              {form.formState.errors.emitterName.message}
                            </p>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emitterStreet">
                            {t('invoice.form.emitterStreet')}
                            <RequiredFieldMark />
                          </Label>
                          <Input
                            id="emitterStreet"
                            aria-required
                            placeholder={t(
                              'invoice.form.emitterStreetPlaceholder',
                            )}
                            {...form.register('emitterStreet')}
                          />
                          {form.formState.errors.emitterStreet ? (
                            <p className="text-xs text-destructive">
                              {form.formState.errors.emitterStreet.message}
                            </p>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emitterStreetLine2">
                            {t('invoice.form.emitterStreetLine2')}
                          </Label>
                          <Input
                            id="emitterStreetLine2"
                            placeholder={t(
                              'invoice.form.emitterStreetLine2Placeholder',
                            )}
                            {...form.register('emitterStreetLine2')}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="emitterPostalCode">
                              {t('invoice.form.emitterPostalCode')}
                              <RequiredFieldMark />
                            </Label>
                            <Input
                              id="emitterPostalCode"
                              aria-required
                              autoComplete="postal-code"
                              {...form.register('emitterPostalCode')}
                            />
                            {form.formState.errors.emitterPostalCode ? (
                              <p className="text-xs text-destructive">
                                {
                                  form.formState.errors.emitterPostalCode
                                    .message
                                }
                              </p>
                            ) : null}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="emitterCity">
                              {t('invoice.form.emitterCity')}
                              <RequiredFieldMark />
                            </Label>
                            <Input
                              id="emitterCity"
                              aria-required
                              autoComplete="address-level2"
                              {...form.register('emitterCity')}
                            />
                            {form.formState.errors.emitterCity ? (
                              <p className="text-xs text-destructive">
                                {form.formState.errors.emitterCity.message}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emitterCountry">
                            {t('invoice.form.emitterCountry')}
                          </Label>
                          <Input
                            id="emitterCountry"
                            autoComplete="country-name"
                            placeholder={t(
                              'invoice.form.emitterCountryPlaceholder',
                            )}
                            {...form.register('emitterCountry')}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="emitterSiret">
                              {t('invoice.form.emitterSiret')}
                            </Label>
                            <Input
                              id="emitterSiret"
                              {...form.register('emitterSiret')}
                            />
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
                        <div className="space-y-2">
                          <Label htmlFor="emitterVatNumber">
                            {t('invoice.form.emitterVatNumber')}
                          </Label>
                          <Input
                            id="emitterVatNumber"
                            placeholder={t(
                              'invoice.form.emitterVatNumberPlaceholder',
                            )}
                            {...form.register('emitterVatNumber')}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* ── Tab: Client ── */}
                    <TabsContent value="client" className="mt-4 space-y-4">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="clientName">
                            {t('invoice.form.clientName')}
                            <RequiredFieldMark />
                          </Label>
                          <Input
                            id="clientName"
                            aria-required
                            {...form.register('clientName')}
                          />
                          {form.formState.errors.clientName ? (
                            <p className="text-xs text-destructive">
                              {form.formState.errors.clientName.message}
                            </p>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clientStreet">
                            {t('invoice.form.clientStreet')}
                            <RequiredFieldMark />
                          </Label>
                          <Input
                            id="clientStreet"
                            aria-required
                            placeholder={t(
                              'invoice.form.clientStreetPlaceholder',
                            )}
                            {...form.register('clientStreet')}
                          />
                          {form.formState.errors.clientStreet ? (
                            <p className="text-xs text-destructive">
                              {form.formState.errors.clientStreet.message}
                            </p>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clientStreetLine2">
                            {t('invoice.form.clientStreetLine2')}
                          </Label>
                          <Input
                            id="clientStreetLine2"
                            placeholder={t(
                              'invoice.form.clientStreetLine2Placeholder',
                            )}
                            {...form.register('clientStreetLine2')}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="clientPostalCode">
                              {t('invoice.form.clientPostalCode')}
                              <RequiredFieldMark />
                            </Label>
                            <Input
                              id="clientPostalCode"
                              aria-required
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
                              <RequiredFieldMark />
                            </Label>
                            <Input
                              id="clientCity"
                              aria-required
                              autoComplete="address-level2"
                              {...form.register('clientCity')}
                            />
                            {form.formState.errors.clientCity ? (
                              <p className="text-xs text-destructive">
                                {form.formState.errors.clientCity.message}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clientCountry">
                            {t('invoice.form.clientCountry')}
                          </Label>
                          <Input
                            id="clientCountry"
                            autoComplete="country-name"
                            placeholder={t(
                              'invoice.form.clientCountryPlaceholder',
                            )}
                            {...form.register('clientCountry')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clientEmail">
                            {t('invoice.form.clientEmail')}
                          </Label>
                          <Input
                            id="clientEmail"
                            type="email"
                            {...form.register('clientEmail')}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* ── Tab: Items ── */}
                    <TabsContent value="items" className="mt-4 space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-sm font-medium text-muted-foreground">
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
                        <div className="space-y-3">
                          {fields.map((field, index) => (
                            <div
                              key={field.id}
                              className="space-y-3 rounded-lg border border-border/80 p-3"
                            >
                              <div className="space-y-2">
                                <Label>
                                  {t('invoice.form.description')}
                                  <RequiredFieldMark />
                                </Label>
                                <Input
                                  aria-required
                                  {...form.register(
                                    `lines.${index}.description` as const,
                                  )}
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2">
                                  <Label>
                                    {t('invoice.form.qty')}
                                    <RequiredFieldMark />
                                  </Label>
                                  <Input
                                    type="number"
                                    step={1}
                                    aria-required
                                    {...form.register(
                                      `lines.${index}.quantity` as const,
                                    )}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>
                                    {t('invoice.form.unitPriceHt')}
                                    <RequiredFieldMark />
                                  </Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    aria-required
                                    {...form.register(
                                      `lines.${index}.unitPrice` as const,
                                    )}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>
                                    {t('invoice.form.vatPercent')}
                                    <RequiredFieldMark />
                                  </Label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    min={0}
                                    max={100}
                                    aria-required
                                    {...form.register(
                                      `lines.${index}.vatPercent`,
                                      {
                                        valueAsNumber: true,
                                      },
                                    )}
                                  />
                                </div>
                              </div>
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
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4 border-t border-border/60 pt-4">
                        <div className="max-w-xs space-y-2">
                          <Label>
                            {t('invoice.form.currency')}
                            <RequiredFieldMark />
                          </Label>
                          <Select
                            value={form.watch('currency')}
                            onValueChange={(v) =>
                              form.setValue(
                                'currency',
                                v as InvoiceFormValues['currency'],
                              )
                            }
                          >
                            <SelectTrigger aria-required>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USDC">USDC</SelectItem>
                              <SelectItem value="EURC">EURC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="issueDate">
                              {t('invoice.form.issueDate')}
                              <RequiredFieldMark />
                            </Label>
                            <Input
                              id="issueDate"
                              type="date"
                              aria-required
                              {...form.register('issueDate')}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dueDate">
                              {t('invoice.form.dueDate')}
                              <RequiredFieldMark />
                            </Label>
                            <Input
                              id="dueDate"
                              type="date"
                              aria-required
                              {...form.register('dueDate')}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes">
                            {t('invoice.form.notes')}
                          </Label>
                          <Textarea
                            id="notes"
                            rows={3}
                            {...form.register('notes')}
                          />
                        </div>
                      </div>

                      <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
                        <p className="font-medium">
                          {t('invoice.form.summary')}
                        </p>
                        <p className="mt-2 text-muted-foreground">
                          {t('invoice.form.summaryLine', {
                            ht: totals.totalHt.toFixed(2),
                            vat: totals.tvaAmount.toFixed(2),
                            ttc: totals.totalTtc.toFixed(2),
                          })}
                        </p>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>

              <div className="flex shrink-0 items-center justify-between border-t border-border/60 py-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={stepIndex === 0}
                  onClick={() => setStepIndex((s) => s - 1)}
                >
                  {t('invoice.form.tabPrev')}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {stepIndex + 1} / {INVOICE_TABS.length}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  {IS_DEV ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs text-amber-600 border-amber-500/40 hover:bg-amber-500/10 dark:text-amber-400"
                      onClick={fillDevData}
                    >
                      Dev: Autofill
                    </Button>
                  ) : null}
                  {stepIndex === INVOICE_TAB_LAST ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        stepSubmitting || isWritePending || loadingRpForSubmit
                      }
                      onClick={() => void submitInvoice()}
                    >
                      {loadingRpForSubmit
                        ? t('invoice.form.submitPreparingWorldId')
                        : stepSubmitting || isWritePending
                          ? t('invoice.form.submitTransaction')
                          : t('invoice.form.tabValidate')}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setStepIndex((s) => s + 1)}
                    >
                      {t('invoice.form.tabNext')}
                    </Button>
                  )}
                </div>
              </div>
              </form>
            </div>

            {/* ── Right panel: invoice preview (60% ≥ lg) ── */}
            <div className="hidden min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl bg-muted/20 lg:flex lg:flex-[3]">
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 lg:p-3">
                <div className="flex min-h-full w-full items-start justify-center">
                  <div className="w-full">
                    <InvoicePreviewDocument
                      values={debouncedPreview}
                      previewRef={previewRef}
                      emitterWorldIdNullifier={previewWorldIdNullifier}
                      draftDocumentNo={draftDocumentNo}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
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
          onSuccess={(r) => void handleIdKitSuccessFromSubmit(r)}
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
