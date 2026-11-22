import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

export function PageContent({ className, ...props }: ComponentProps<'main'>) {
  return (
    <main
      data-slot='page-content'
      className={cn(
        [
          'relative z-10 mx-auto -mt-4 w-full',
          'max-w-7xl px-5 sm:-mt-6 sm:px-8',
          '[&>*:first-child]:!mt-0',
        ].join(' '),
        className,
      )}
      {...props}
    />
  );
}
