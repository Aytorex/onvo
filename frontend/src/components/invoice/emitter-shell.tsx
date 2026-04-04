'use client';

import { OnvoLogo } from '@/components/shared/onvo-logo';
import { WalletButton } from '@/components/shared/wallet-button';
import { Button } from '@/components/ui/button';
import { useWorldID } from '@/lib/worldid';
import { FilePlus2, LayoutDashboard, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function EmitterShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useWorldID();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <OnvoLogo className="text-xl" />
          </Link>
          <nav className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
            <Button
              variant={pathname === '/dashboard' ? 'secondary' : 'ghost'}
              size="sm"
              asChild
            >
              <Link href="/dashboard">
                <LayoutDashboard className="mr-1.5 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button
              variant={
                pathname?.startsWith('/invoice/new') ? 'secondary' : 'ghost'
              }
              size="sm"
              asChild
            >
              <Link href="/invoice/new">
                <FilePlus2 className="mr-1.5 h-4 w-4" />
                Nouvelle facture
              </Link>
            </Button>
            <WalletButton />
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => void logout()}
            >
              <LogOut className="mr-1.5 h-4 w-4" />
              Log out
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
