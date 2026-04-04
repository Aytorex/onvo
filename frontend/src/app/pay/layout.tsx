import { OnvoLogo } from '@/components/shared/onvo-logo';

export default function PayLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-8 text-foreground sm:py-12">
      <header className="mx-auto mb-8 w-full max-w-2xl">
        <OnvoLogo />
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1">{children}</main>
    </div>
  );
}
