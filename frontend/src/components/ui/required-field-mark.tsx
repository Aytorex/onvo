import { cn } from '@/lib/utils';

export function RequiredFieldMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'ml-0.5 font-semibold leading-none text-destructive',
        className,
      )}
      aria-hidden="true"
    >
      *
    </span>
  );
}
