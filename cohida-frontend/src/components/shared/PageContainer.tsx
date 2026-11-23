import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

type PageContainerProps = ComponentProps<'div'> & {
  as?: 'div' | 'main';
};

export function PageContainer({
  as: Component = 'div',
  className,
  ...props
}: PageContainerProps) {
  return (
    <Component
      className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}
      {...props}
    />
  );
}
