'use client';

import { LanguageToggle } from '@/components/shared/language-toggle';
import { OnvoLogo } from '@/components/shared/onvo-logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function PayLayoutHeader() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">
      <OnvoLogo />
      <div className="flex shrink-0 items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </div>
  );
}
