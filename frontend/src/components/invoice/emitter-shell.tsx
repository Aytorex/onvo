'use client';

import { LanguageToggle } from '@/components/shared/language-toggle';
import { OnvoLogo } from '@/components/shared/onvo-logo';
import { WalletButton } from '@/components/shared/wallet-button';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { cropOnvoLabelMiddle, formatOnvoInvoiceLabel } from '@/lib/invoice-id';
import { useEmitterOnChainReady } from '@/lib/emitter-onchain';
import { useWorldID } from '@/lib/worldid';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  FilePlus2,
  LayoutDashboard,
  List,
  LogOut,
  Menu,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const SIDEBAR_COLLAPSED_KEY = 'onvo_emitter_sidebar_collapsed';

type NavItem = {
  href: string;
  icon: typeof LayoutDashboard;
  labelKey: string;
  match: (pathname: string) => boolean;
};

export function EmitterShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { authReady, isVerified, logout } = useWorldID();
  const {
    address,
    isConnected,
    emitterReady,
    emitterVerified,
    emitterVerifyPending,
  } = useEmitterOnChainReady();
  const { t } = useTranslation('common');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHydrated, setSidebarHydrated] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (v === '1') setSidebarCollapsed(true);
    } catch {
      /* ignore */
    }
    setSidebarHydrated(true);
  }, []);

  const needsEmitterSetupGate = useMemo(() => {
    if (pathname == null) return false;
    if (pathname === '/dashboard') return false;
    return (
      pathname === '/dashboard/invoices' || pathname.startsWith('/invoice/')
    );
  }, [pathname]);

  useEffect(() => {
    if (!authReady || !isVerified || !needsEmitterSetupGate) return;
    if (!isConnected || !address) {
      router.replace('/dashboard');
      return;
    }
    if (emitterVerifyPending) return;
    if (emitterVerified !== true) {
      router.replace('/dashboard');
    }
  }, [
    address,
    authReady,
    emitterVerifyPending,
    emitterVerified,
    isConnected,
    isVerified,
    needsEmitterSetupGate,
    router,
  ]);

  const showEmitterRouteBlocker =
    authReady &&
    isVerified &&
    needsEmitterSetupGate &&
    (!isConnected ||
      !address ||
      emitterVerifyPending ||
      emitterVerified !== true);

  const setCollapsed = (next: boolean) => {
    setSidebarCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  const navItems: NavItem[] = useMemo(
    () => [
      {
        href: '/dashboard',
        icon: LayoutDashboard,
        labelKey: 'emitterNav.dashboard',
        match: (p) => p === '/dashboard',
      },
      {
        href: '/dashboard/invoices',
        icon: List,
        labelKey: 'emitterNav.invoiceList',
        match: (p) => p === '/dashboard/invoices',
      },
      {
        href: '/invoice/new',
        icon: FilePlus2,
        labelKey: 'emitterNav.newInvoice',
        match: (p) => p.startsWith('/invoice/new'),
      },
    ],
    [],
  );

  const invoiceDetailHeader = useMemo(() => {
    const m = pathname?.match(/^\/invoice\/(\d+)$/);
    if (!m) return null;
    try {
      const id = BigInt(m[1]);
      const full = formatOnvoInvoiceLabel(id);
      return { full, short: cropOnvoLabelMiddle(full) };
    } catch {
      return null;
    }
  }, [pathname]);

  const pageTitle = useMemo(() => {
    if (pathname === '/dashboard') return t('invoice.dashboard.title');
    if (pathname === '/dashboard/invoices')
      return t('invoice.dashboard.invoiceListPageTitle');
    if (pathname?.startsWith('/invoice/new')) return t('invoice.form.title');
    return t('meta.title');
  }, [pathname, t]);

  const copyInvoiceLabelRef = useCallback(() => {
    if (!invoiceDetailHeader) return;
    void navigator.clipboard.writeText(invoiceDetailHeader.full).then(
      () => {
        toast.success(t('invoice.detail.copyInvoiceLabelSuccess'));
      },
      () => {
        toast.error(t('invoice.detail.copyInvoiceLabelError'));
      },
    );
  }, [invoiceDetailHeader, t]);

  const navLockedHint = t('emitterNav.navLockedHint');

  const renderNavLinks = (mobile: boolean) =>
    navItems.map((item) => {
      const active = item.match(pathname ?? '');
      const locked = item.href !== '/dashboard' && !emitterReady;
      const base = mobile
        ? cn(
            'flex items-center gap-4 rounded-xl px-3 py-2 transition-colors',
            locked
              ? 'cursor-not-allowed text-muted-foreground/45'
              : active
                ? 'bg-muted text-primary hover:bg-muted hover:text-primary'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground',
          )
        : cn(
            'flex items-center gap-3 rounded-xl px-3 py-2 transition-all',
            locked
              ? 'cursor-not-allowed text-muted-foreground/40'
              : active
                ? 'bg-muted text-primary hover:text-primary'
                : 'text-muted-foreground hover:text-primary',
          );
      if (locked) {
        return (
          <span
            key={item.href}
            className={base}
            aria-disabled
            title={navLockedHint}
          >
            <item.icon className={mobile ? 'h-5 w-5' : 'h-4 w-4'} />
            {t(item.labelKey)}
          </span>
        );
      }
      return (
        <Link key={item.href} href={item.href} className={base}>
          <item.icon className={mobile ? 'h-5 w-5' : 'h-4 w-4'} />
          {t(item.labelKey)}
        </Link>
      );
    });

  const renderDesktopNavLinks = (collapsed: boolean) =>
    navItems.map((item) => {
      const active = item.match(pathname ?? '');
      const label = t(item.labelKey);
      const locked = item.href !== '/dashboard' && !emitterReady;
      const linkClass = cn(
        'flex items-center rounded-xl text-sm font-medium transition-all',
        collapsed
          ? 'mx-auto size-10 shrink-0 justify-center p-0'
          : 'h-10 min-h-10 gap-3 px-3 py-0',
        locked
          ? 'cursor-not-allowed text-muted-foreground/45'
          : active
            ? 'bg-muted text-primary hover:text-primary'
            : 'text-muted-foreground hover:text-primary',
      );

      const link = locked ? (
        <span
          className={linkClass}
          aria-disabled
          aria-label={collapsed ? `${label} — ${navLockedHint}` : undefined}
          title={navLockedHint}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span
            className={cn(
              'truncate transition-[opacity,width,margin] duration-200',
              collapsed
                ? 'sr-only w-0 overflow-hidden opacity-0'
                : 'opacity-100',
            )}
          >
            {label}
          </span>
        </span>
      ) : (
        <Link
          href={item.href}
          className={linkClass}
          aria-label={collapsed ? label : undefined}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span
            className={cn(
              'truncate transition-[opacity,width,margin] duration-200',
              collapsed
                ? 'sr-only w-0 overflow-hidden opacity-0'
                : 'opacity-100',
            )}
          >
            {label}
          </span>
        </Link>
      );

      if (collapsed) {
        return (
          <Tooltip key={item.href} delayDuration={0}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {locked ? navLockedHint : label}
            </TooltipContent>
          </Tooltip>
        );
      }

      return <Fragment key={item.href}>{link}</Fragment>;
    });

  const isNewInvoicePage = pathname?.startsWith('/invoice/new');

  const shellMainClass = cn(
    'mx-auto flex min-w-0 w-full flex-1 flex-col min-h-0',
    isNewInvoicePage
      ? 'max-w-[min(100%,100rem)] gap-4 overflow-hidden p-4 lg:gap-6 lg:p-6'
      : 'max-w-6xl gap-4 overflow-x-hidden overflow-y-auto overscroll-y-contain p-4 lg:gap-6 lg:p-6',
  );

  const emitterContentColumnClass = cn(
    'flex min-h-0 min-w-0 flex-1 flex-col',
    isNewInvoicePage ? 'h-dvh max-h-dvh overflow-hidden' : 'overflow-hidden',
  );

  if (!authReady || !isVerified) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2">
            <OnvoLogo className="text-xl" />
          </Link>
        </header>
        <main className="flex flex-1 flex-col px-4 py-8 lg:px-6">
          {children}
        </main>
      </div>
    );
  }

  const collapsed = sidebarHydrated && sidebarCollapsed;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-dvh max-h-dvh min-h-0 w-full overflow-hidden">
        <div
          className={cn(
            'hidden h-[100dvh] max-h-[100dvh] shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 ease-out md:sticky md:top-0 md:z-30 md:flex',
            collapsed ? 'w-[4.5rem]' : 'w-[192px] lg:w-[228px]',
          )}
          id="emitter-sidebar"
        >
          <div className="flex h-full min-h-0 flex-col gap-2">
            <div
              className={cn(
                'flex shrink-0 items-center border-b lg:h-[60px]',
                collapsed
                  ? 'h-14 flex-col justify-center gap-1 py-1.5'
                  : 'h-14 justify-between gap-2 px-3 lg:px-4',
              )}
            >
              {!collapsed ? (
                <Link
                  href="/dashboard"
                  className="shrink-0 font-bold text-heading"
                >
                  <OnvoLogo className="text-lg" />
                </Link>
              ) : null}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-10 shrink-0 rounded-xl"
                    aria-expanded={!collapsed}
                    aria-controls="emitter-sidebar"
                    onClick={() => setCollapsed(!sidebarCollapsed)}
                  >
                    {collapsed ? (
                      <ChevronRight className="h-5 w-5" />
                    ) : (
                      <ChevronLeft className="h-5 w-5" />
                    )}
                    <span className="sr-only">
                      {collapsed
                        ? t('emitterNav.expandSidebar')
                        : t('emitterNav.collapseSidebar')}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {collapsed
                    ? t('emitterNav.expandSidebar')
                    : t('emitterNav.collapseSidebar')}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <nav
                className={cn(
                  'grid items-start gap-1 text-sm font-medium',
                  collapsed ? 'px-2 py-1' : 'px-3 py-1',
                )}
              >
                {renderDesktopNavLinks(collapsed)}
              </nav>
            </div>
            <div
              className={cn(
                'shrink-0 border-t border-border',
                collapsed ? 'flex justify-center p-1.5' : 'px-3 py-1.5 lg:px-4',
              )}
            >
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-10 shrink-0 rounded-xl text-muted-foreground hover:text-primary"
                      onClick={() => void logout()}
                      aria-label={t('emitterNav.logOut')}
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {t('emitterNav.logOut')}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  className="h-10 min-h-10 w-full justify-start gap-3 rounded-xl px-3 text-muted-foreground hover:text-primary"
                  onClick={() => void logout()}
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  {t('emitterNav.logOut')}
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className={emitterContentColumnClass}>
          <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:h-[60px] lg:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex min-h-0 flex-col"
                aria-describedby={undefined}
              >
                <SheetTitle className="sr-only">
                  {t('nav.mobileMenu')}
                </SheetTitle>
                <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto text-lg font-medium">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-lg font-semibold transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <OnvoLogo className="text-3xl leading-none sm:text-4xl" />
                  </Link>
                  {renderNavLinks(true)}
                </nav>
                <div className="flex shrink-0 items-center gap-2 border-t border-border pt-4 md:hidden">
                  <LanguageToggle />
                  <ThemeToggle />
                </div>
                <div className="shrink-0 border-t border-border pt-4">
                  <Button
                    variant="ghost"
                    className="h-auto min-h-10 w-full justify-start gap-4 rounded-xl px-3 py-2 text-lg font-medium"
                    onClick={() => void logout()}
                  >
                    <LogOut className="h-5 w-5" />
                    {t('emitterNav.logOut')}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {collapsed ? (
                <Link
                  href="/dashboard"
                  aria-label={`${t('meta.title')} — ${t('emitterNav.dashboard')}`}
                  className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <OnvoLogo />
                </Link>
              ) : null}
              {invoiceDetailHeader ? (
                <div className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                  <h1
                    className="inline-block max-w-[min(100%,calc(100vw-11rem))] truncate text-lg font-bold tracking-tight text-heading sm:max-w-[min(42rem,calc(100vw-13rem))]"
                    title={`${t('invoice.detail.invoiceLabel')} · ${invoiceDetailHeader.full}`}
                  >
                    {t('invoice.detail.invoiceLabel')} ·{' '}
                    {invoiceDetailHeader.short}
                  </h1>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label={t('invoice.detail.copyInvoiceLabelAria')}
                    title={t('invoice.detail.copyInvoiceLabel')}
                    onClick={copyInvoiceLabelRef}
                  >
                    <Copy className="size-4" aria-hidden />
                  </Button>
                </div>
              ) : (
                <h1 className="min-w-0 flex-1 truncate text-lg font-bold tracking-tight text-heading">
                  {pageTitle}
                </h1>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden items-center gap-2 md:flex">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              <WalletButton />
            </div>
          </header>
          <main className={shellMainClass}>
            {showEmitterRouteBlocker ? (
              <div
                className="min-h-[40vh] animate-pulse rounded-xl bg-muted/30 p-4"
                aria-busy
                aria-label={t('invoice.dashboard.loading')}
              />
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
