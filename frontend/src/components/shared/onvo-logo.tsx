import { cn } from '@/lib/utils';

export function OnvoLogo({ className }: Readonly<{ className?: string }>) {
  return (
    <div
      className={cn(
        'select-none text-2xl font-bold tracking-tight sm:text-3xl',
        className,
      )}
      role="img"
      aria-label="ONVO"
    >
      <span className="text-heading">ONV</span>
      <span className="bg-gradient-to-r from-onvo-purple to-onvo-cyan bg-clip-text text-transparent">
        O
      </span>
    </div>
  );
}
