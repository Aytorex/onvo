import { isAddress } from 'viem';
import { z } from 'zod';

const lineSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Description requise'),
  quantity: z.coerce.number().positive('Quantité > 0'),
  unitPrice: z.coerce.number().nonnegative('Prix ≥ 0'),
  vatPercent: z.coerce.number().min(0).max(100),
});

export const invoiceFormSchema = z.object({
  emitterName: z.string().min(1, 'Nom requis'),
  emitterAddress: z.string().min(1),
  emitterSiret: z.string(),
  emitterEmail: z.union([z.literal(''), z.string().email()]),
  clientName: z.string().min(1, 'Client requis'),
  clientWallet: z
    .string()
    .min(1, 'Adresse wallet requise')
    .refine((v) => isAddress(v), { message: 'Adresse Ethereum invalide' }),
  clientEmail: z.union([z.literal(''), z.string().email()]),
  lines: z.array(lineSchema).min(1, 'Au moins une ligne'),
  invoiceNumber: z.string().min(1),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  currency: z.enum(['USDC', 'EURC']),
  notes: z.string(),
});

export type InvoiceFormSchema = z.infer<typeof invoiceFormSchema>;
