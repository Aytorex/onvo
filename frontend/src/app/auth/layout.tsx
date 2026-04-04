'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MagicRings } from '@/components/shared/magic-rings';
import { LanguageToggle } from '@/components/shared/language-toggle';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

      <div className="absolute right-4 top-4 z-20 flex gap-1 sm:right-6 sm:top-6">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">{children}</div>
    </div>
  );
}
