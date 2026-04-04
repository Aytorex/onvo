import { EmitterShell } from '@/components/invoice/emitter-shell';

export default function InvoiceSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EmitterShell>{children}</EmitterShell>;
}
