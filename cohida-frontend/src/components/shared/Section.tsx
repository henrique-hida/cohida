import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

type SectionProps = ComponentProps<'section'> & {
  contentClassName?: string;
};

export function Section({
  children,
  className,
  contentClassName,
  ...props
}: SectionProps) {
  return (
    <section className={cn('relative isolate w-full', className)} {...props}>
      <div
        className={cn(
          'mx-auto w-full max-w-7xl px-4 py-12',
          'sm:px-6 md:py-20 lg:px-8',
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
