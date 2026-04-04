import { PayLayoutHeader } from '@/components/pay/pay-layout-header';

export default function PayLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="pay-page flex min-h-screen flex-col bg-background px-4 py-8 text-foreground sm:py-12">
      <header className="mb-8 w-full">
        <PayLayoutHeader />
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1">{children}</main>
    </div>
  );
}
