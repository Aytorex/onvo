import type { TFunction } from 'i18next';
import { isAddress } from 'viem';
import { z } from 'zod';

export function createInvoiceFormSchema(t: TFunction<'common'>) {
  const lineSchema = z.object({
    id: z.string(),
    description: z
      .string()
      .min(1, t('invoice.validation.lineDescriptionRequired')),
    quantity: z.coerce
      .number()
      .positive(t('invoice.validation.quantityPositive')),
    unitPrice: z.coerce
      .number()
      .nonnegative(t('invoice.validation.priceNonnegative')),
    vatPercent: z.coerce.number().min(0).max(100),
  });

  const optionalEmail = z.union([
    z.literal(''),
    z.string().email(t('invoice.validation.invalidEmail')),
  ]);

  return z.object({
    emitterName: z.string().min(1, t('invoice.validation.emitterNameRequired')),
    emitterAddress: z
      .string()
      .min(1, t('invoice.validation.emitterAddressRequired')),
    emitterSiret: z.string(),
    emitterEmail: optionalEmail,
    clientName: z.string().min(1, t('invoice.validation.clientRequired')),
    clientWallet: z
      .string()
      .min(1, t('invoice.validation.walletRequired'))
      .refine((v) => isAddress(v), {
        message: t('invoice.validation.invalidEthAddress'),
      }),
    clientEmail: optionalEmail,
    lines: z.array(lineSchema).min(1, t('invoice.validation.minOneLine')),
    invoiceNumber: z
      .string()
      .min(1, t('invoice.validation.invoiceNumberRequired')),
    issueDate: z.string().min(1, t('invoice.validation.issueDateRequired')),
    dueDate: z.string().min(1, t('invoice.validation.dueDateRequired')),
    currency: z.enum(['USDC', 'EURC']),
    notes: z.string(),
  });
}

export type InvoiceFormSchema = z.infer<
  ReturnType<typeof createInvoiceFormSchema>
>;
