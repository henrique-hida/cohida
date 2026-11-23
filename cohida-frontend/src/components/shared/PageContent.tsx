import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

type PageContentProps = ComponentProps<'main'> & {
  overlap?: boolean;
};

export function PageContent({
  className,
  overlap = true,
  ...props
}: PageContentProps) {
  return (
    <main
      data-slot='page-content'
      className={cn(
        [
          'relative z-10 mx-auto w-full',
          'max-w-7xl px-5 sm:px-8',
          '[&>*:first-child]:!mt-0',
        ].join(' '),
        overlap && '-mt-4 sm:-mt-6',
        className,
      )}
      {...props}
    />
  );
}
