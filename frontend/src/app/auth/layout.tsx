'use client';

import Link from 'next/link';
import { ArrowLeft, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { MagicRings } from '@/components/shared/magic-rings';
import { LanguageToggle } from '@/components/shared/language-toggle';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation('common');
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <MagicRings
          color="#7C3AED"
          colorTwo="#38BDF8"
          speed={0.5}
          ringCount={4}
          attenuation={12}
          lineThickness={1.5}
          baseRadius={0.3}
          radiusStep={0.12}
          scaleRate={0.08}
          opacity={0.4}
          noiseAmount={0.03}
          followMouse={false}
        />
      </div>

      <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="absolute right-4 top-4 z-20 flex items-center gap-1 sm:right-6 sm:top-6">
        <div className="hidden items-center gap-1 md:flex">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={t('nav.mobileMenu')}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="flex flex-col gap-6"
            aria-describedby={undefined}
          >
            <SheetTitle className="sr-only">{t('nav.mobileMenu')}</SheetTitle>
            <div className="flex items-center gap-2 pt-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">{children}</div>
    </div>
  );
}
