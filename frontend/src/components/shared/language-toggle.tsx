'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLocalePreference } from '@/contexts/i18n-provider';
import { Check, Languages, LaptopMinimal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LanguageToggle() {
  const { t } = useTranslation('common');
  const { localeMode, setLocaleMode } = useLocalePreference();

  return (
    <TooltipProvider delayDuration={300}>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('language.label')}
              >
                <Languages className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('language.tooltip')}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="justify-between gap-4"
            onClick={() => setLocaleMode('device')}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <LaptopMinimal
                className="h-4 w-4 shrink-0 opacity-70"
                aria-hidden
              />
              {t('language.device')}
            </span>
            {localeMode === 'device' ? (
              <Check className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            ) : null}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="justify-between gap-4"
            onClick={() => setLocaleMode('en')}
          >
            {t('language.en')}
            {localeMode === 'en' ? (
              <Check className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            ) : null}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="justify-between gap-4"
            onClick={() => setLocaleMode('fr')}
          >
            {t('language.fr')}
            {localeMode === 'fr' ? (
              <Check className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            ) : null}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
