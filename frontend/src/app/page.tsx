'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/components/shared/language-toggle';
import { OnvoLogo } from '@/components/shared/onvo-logo';
import { MagicRings } from '@/components/shared/magic-rings';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import Image from 'next/image';
import { ArrowRight, Fingerprint, FileCheck2, Menu, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

function AnimateOnScroll({
  children,
  animation,
  className,
  threshold = 0.2,
}: {
  children: React.ReactNode;
  animation: string;
  className?: string;
  threshold?: number;
}) {
  const { ref, isVisible } = useInView(threshold);

  return (
    <div
      ref={ref}
      className={cn(isVisible ? animation : 'opacity-0', className)}
    >
      {children}
    </div>
  );
}

const LANDING_FEATURES = [
  {
    id: 'worldId',
    gradient: 'from-onvo-purple/20 to-onvo-purple/5',
    lightLogo: '/logos/world.svg',
    darkLogo: '/logos/world-dark.svg',
    logoWidth: 100,
    logoHeight: 32,
  },
  {
    id: 'dynamic',
    gradient: 'from-onvo-cyan/20 to-onvo-cyan/5',
    lightLogo: '/logos/dynamic.svg',
    darkLogo: '/logos/dynamic-dark.svg',
    logoWidth: 448,
    logoHeight: 100,
  },
  {
    id: 'arc',
    gradient: 'from-onvo-purple/15 to-onvo-cyan/15',
    lightLogo: '/logos/arc-light.svg',
    darkLogo: '/logos/arc.svg',
    logoWidth: 80,
    logoHeight: 32,
  },
] as const;

const LANDING_STEPS = [
  { id: 'verify', icon: Fingerprint },
  { id: 'create', icon: FileCheck2 },
  { id: 'paid', icon: Send },
] as const;

const LANDING_SPONSORS = [
  {
    id: 'world',
    name: 'World',
    lightLogo: '/logos/world.svg',
    darkLogo: '/logos/world-dark.svg',
    width: 120,
    height: 30,
  },
  {
    id: 'arc',
    name: 'Arc',
    lightLogo: '/logos/arc-light.svg',
    darkLogo: '/logos/arc.svg',
    width: 100,
    height: 34,
  },
  {
    id: 'dynamic',
    name: 'Dynamic',
    lightLogo: '/logos/dynamic.svg',
    darkLogo: '/logos/dynamic-dark.svg',
    width: 448,
    height: 100,
  },
] as const;

export default function LandingPage() {
  const { t } = useTranslation('common');
  const ctaView = useInView();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-6">
          <OnvoLogo className="text-xl sm:text-2xl" />
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
              <LanguageToggle />
              <ThemeToggle />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
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
                <SheetTitle className="sr-only">
                  {t('nav.mobileMenu')}
                </SheetTitle>
                <div className="flex items-center gap-2 pt-2">
                  <LanguageToggle />
                  <ThemeToggle />
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/auth" className="ml-1">
              <Button size="sm">
                {t('landing.createInvoice')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <MagicRings
            color="#7C3AED"
            colorTwo="#38BDF8"
            speed={0.8}
            ringCount={6}
            attenuation={8}
            lineThickness={2.5}
            baseRadius={0.25}
            radiusStep={0.08}
            scaleRate={0.12}
            opacity={0.7}
            noiseAmount={0.05}
            ringGap={1.4}
            fadeIn={0.8}
            fadeOut={0.4}
            followMouse
            mouseInfluence={0.15}
            hoverScale={1.1}
            parallax={0.04}
            clickBurst
          />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <div className="animate-fade-in-up">
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-onvo-purple">
              {t('landing.hero.eyebrow')}
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-heading sm:text-5xl md:text-6xl lg:text-7xl">
              {t('landing.hero.titleBefore')}{' '}
              <span className="bg-gradient-to-r from-onvo-purple to-onvo-cyan bg-clip-text text-transparent">
                {t('landing.hero.titleHighlight')}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              {t('landing.hero.subtitle')}
            </p>
          </div>

          <div
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            style={{ animationDelay: '0.2s' }}
          >
            <Link href="/auth">
              <Button size="lg" className="px-8 text-base">
                {t('landing.createInvoice')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="px-8 text-base">
                {t('landing.learnMore')}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ─── Sponsors Strip ─── */}
      <section className="border-y border-border/40 bg-card/50 py-12">
        <div className="mx-auto max-w-4xl px-6">
          <p className="mb-10 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {t('landing.poweredBy')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-16 sm:gap-24">
            {LANDING_SPONSORS.map((sponsor) => (
              <div
                key={sponsor.id}
                className="group flex flex-col items-center gap-3 transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex h-12 items-center justify-center opacity-80 transition-opacity duration-300 group-hover:opacity-100">
                  <Image
                    src={sponsor.lightLogo}
                    alt={sponsor.name}
                    width={sponsor.width}
                    height={sponsor.height}
                    className="block h-8 w-auto dark:hidden sm:h-10"
                    style={{ width: 'auto' }}
                  />
                  <Image
                    src={sponsor.darkLogo}
                    alt={sponsor.name}
                    width={sponsor.width}
                    height={sponsor.height}
                    className="hidden h-8 w-auto dark:block sm:h-10"
                    style={{ width: 'auto' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {t(`landing.sponsors.${sponsor.id}.label`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <AnimateOnScroll animation="animate-fade-in-up">
            <div className="mb-20 text-center">
              <p className="mb-2 text-sm font-medium uppercase tracking-widest text-onvo-purple">
                {t('landing.featuresSection.eyebrow')}
              </p>
              <h2 className="text-3xl font-bold text-heading sm:text-4xl">
                {t('landing.featuresSection.title')}
              </h2>
            </div>
          </AnimateOnScroll>

          <div className="space-y-20 md:space-y-32">
            {LANDING_FEATURES.map((feature, i) => {
              const iconSlide =
                i % 2 === 0
                  ? 'animate-slide-in-left'
                  : 'animate-slide-in-right';
              const textSlide =
                i % 2 === 0
                  ? 'animate-slide-in-right'
                  : 'animate-slide-in-left';
              const title = t(`landing.features.${feature.id}.title`);

              return (
                <div
                  key={feature.id}
                  className={cn(
                    'grid items-center gap-10 md:grid-cols-2 md:gap-16',
                    i % 2 === 1 && 'md:[&>*:first-child]:order-2',
                  )}
                >
                  <AnimateOnScroll
                    animation={iconSlide}
                    className="relative flex items-center justify-center"
                  >
                    <div
                      className={cn(
                        'absolute h-48 w-48 rounded-full bg-gradient-to-br opacity-20 blur-3xl sm:h-64 sm:w-64',
                        feature.gradient,
                      )}
                    />
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-border/30 bg-card/80 shadow-xl backdrop-blur-sm sm:h-36 sm:w-36">
                      <Image
                        src={feature.lightLogo}
                        alt={title}
                        width={feature.logoWidth}
                        height={feature.logoHeight}
                        className="block h-auto w-16 dark:hidden sm:w-20"
                        style={{ height: 'auto' }}
                      />
                      <Image
                        src={feature.darkLogo}
                        alt={title}
                        width={feature.logoWidth}
                        height={feature.logoHeight}
                        className="hidden h-auto w-16 dark:block sm:w-20"
                        style={{ height: 'auto' }}
                      />
                    </div>
                  </AnimateOnScroll>

                  <AnimateOnScroll animation={textSlide}>
                    <span className="mb-2 inline-block rounded-full bg-gradient-to-r from-onvo-purple/10 to-onvo-cyan/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-onvo-purple">
                      {t(`landing.features.${feature.id}.subtitle`)}
                    </span>
                    <h3 className="mt-3 text-2xl font-bold text-heading sm:text-3xl">
                      {title}
                    </h3>
                    <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
                      {t(`landing.features.${feature.id}.description`)}
                    </p>
                  </AnimateOnScroll>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="border-y border-border/40 bg-card/30 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl px-6">
          <AnimateOnScroll animation="animate-fade-in-up">
            <div className="mb-20 text-center">
              <p className="mb-2 text-sm font-medium uppercase tracking-widest text-onvo-cyan">
                {t('landing.howItWorks.eyebrow')}
              </p>
              <h2 className="text-3xl font-bold text-heading sm:text-4xl">
                {t('landing.howItWorks.title')}
              </h2>
            </div>
          </AnimateOnScroll>

          <div className="relative">
            <div className="absolute bottom-0 left-8 top-0 hidden w-px bg-gradient-to-b from-onvo-purple via-onvo-cyan to-transparent md:block" />

            <div className="space-y-16">
              {LANDING_STEPS.map((step) => (
                <AnimateOnScroll
                  key={step.id}
                  animation="animate-slide-in-right"
                  className="relative flex gap-8"
                >
                  <div className="relative z-10 hidden flex-shrink-0 md:block">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/50 bg-card shadow-lg">
                      <step.icon className="h-7 w-7 text-onvo-purple" />
                    </div>
                  </div>

                  <div className="flex-1 rounded-2xl border border-border/30 bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:border-border/60 hover:shadow-md sm:p-8">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-onvo-purple/15 to-onvo-cyan/15 md:hidden">
                        <step.icon className="h-5 w-5 text-onvo-purple" />
                      </div>
                      <span className="bg-gradient-to-r from-onvo-purple to-onvo-cyan bg-clip-text text-3xl font-bold text-transparent">
                        {t(`landing.steps.${step.id}.number`)}
                      </span>
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-heading">
                      {t(`landing.steps.${step.id}.title`)}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t(`landing.steps.${step.id}.description`)}
                    </p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section
        className="relative overflow-hidden py-24 sm:py-32"
        ref={ctaView.ref}
      >
        <div className="pointer-events-none absolute inset-0 opacity-40">
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
            opacity={0.5}
            noiseAmount={0.03}
            followMouse={false}
          />
        </div>

        <div
          className={cn(
            'relative z-10 mx-auto max-w-2xl px-6 text-center',
            ctaView.isVisible ? 'animate-fade-in-up' : 'opacity-0',
          )}
        >
          <h2 className="text-3xl font-bold text-heading sm:text-4xl md:text-5xl">
            {t('landing.finalCta.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
            {t('landing.finalCta.subtitle')}
          </p>
          <div className="mt-8">
            <Link href="/auth">
              <Button size="lg" className="px-10 text-base">
                {t('landing.createInvoice')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/40 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
          <OnvoLogo className="text-lg" />
          <p className="text-xs text-muted-foreground">
            {t('landing.footer.builtFor')}
          </p>
        </div>
      </footer>
    </div>
  );
}
