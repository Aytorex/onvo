import type { TFunction } from 'i18next';
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
    emitterStreet: z
      .string()
      .min(1, t('invoice.validation.emitterStreetRequired')),
    emitterStreetLine2: z.string(),
    emitterPostalCode: z
      .string()
      .min(1, t('invoice.validation.emitterPostalCodeRequired')),
    emitterCity: z.string().min(1, t('invoice.validation.emitterCityRequired')),
    emitterCountry: z.string(),
    emitterSiret: z.string(),
    emitterVatNumber: z
      .string()
      .max(64, t('invoice.validation.emitterVatNumberMax')),
    emitterEmail: optionalEmail,
    clientName: z.string().min(1, t('invoice.validation.clientRequired')),
    clientStreet: z
      .string()
      .min(1, t('invoice.validation.clientStreetRequired')),
    clientStreetLine2: z.string(),
    clientPostalCode: z
      .string()
      .min(1, t('invoice.validation.clientPostalCodeRequired')),
    clientCity: z.string().min(1, t('invoice.validation.clientCityRequired')),
    clientCountry: z.string(),
    clientEmail: optionalEmail,
    lines: z.array(lineSchema).min(1, t('invoice.validation.minOneLine')),
    issueDate: z.string().min(1, t('invoice.validation.issueDateRequired')),
    dueDate: z.string().min(1, t('invoice.validation.dueDateRequired')),
    currency: z.enum(['USDC', 'EURC']),
    notes: z.string(),
  });
}

export type InvoiceFormSchema = z.infer<
  ReturnType<typeof createInvoiceFormSchema>
>;
