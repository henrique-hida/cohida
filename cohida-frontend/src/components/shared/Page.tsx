import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { PageContent } from './PageContent';
import { PageHeader } from './PageHeader';

type PageProps = ComponentProps<typeof PageHeader> & {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function Page({
  children,
  className,
  contentClassName,
  ...header
}: PageProps) {
  return (
    <div className={cn('relative isolate pb-8', className)} data-page-layout>
      <PageHeader {...header} />
      <PageContent className={contentClassName} overlap={false}>
        {children}
      </PageContent>
    </div>
  );
}
