import { EmitterShell } from '@/components/invoice/emitter-shell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EmitterShell>{children}</EmitterShell>;
}
