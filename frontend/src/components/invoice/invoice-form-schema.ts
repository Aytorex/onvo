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

  return z.object({
    emitterName: z.string().min(1, t('invoice.validation.emitterNameRequired')),
    emitterAddress: z.string().min(1),
    emitterSiret: z.string(),
    emitterEmail: z.union([z.literal(''), z.string().email()]),
    clientName: z.string().min(1, t('invoice.validation.clientRequired')),
    clientWallet: z
      .string()
      .min(1, t('invoice.validation.walletRequired'))
      .refine((v) => isAddress(v), {
        message: t('invoice.validation.invalidEthAddress'),
      }),
    clientEmail: z.union([z.literal(''), z.string().email()]),
    lines: z.array(lineSchema).min(1, t('invoice.validation.minOneLine')),
    invoiceNumber: z.string().min(1),
    issueDate: z.string().min(1),
    dueDate: z.string().min(1),
    currency: z.enum(['USDC', 'EURC']),
    notes: z.string(),
  });
}

export type InvoiceFormSchema = z.infer<
  ReturnType<typeof createInvoiceFormSchema>
>;
