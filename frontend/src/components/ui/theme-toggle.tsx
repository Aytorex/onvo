'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, LaptopMinimal, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation('common');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t('theme.toggleAria')}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="justify-between gap-4"
          onClick={() => setTheme('system')}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <LaptopMinimal
              className="h-4 w-4 shrink-0 opacity-70"
              aria-hidden
            />
            {t('theme.system')}
          </span>
          {theme === 'system' ? (
            <Check className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="justify-between gap-4"
          onClick={() => setTheme('light')}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <Sun className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            {t('theme.light')}
          </span>
          {theme === 'light' ? (
            <Check className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="justify-between gap-4"
          onClick={() => setTheme('dark')}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <Moon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            {t('theme.dark')}
          </span>
          {theme === 'dark' ? (
            <Check className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          ) : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
