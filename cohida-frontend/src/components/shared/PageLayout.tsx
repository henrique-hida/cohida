import type { ReactNode } from 'react';

import { PageContent } from './PageContent';
import { PageHeader } from './PageHeader';

type PageLayoutProps = {
  action?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  description: ReactNode;
  title: ReactNode;
};

export function PageLayout({
  action,
  children,
  contentClassName,
  description,
  title,
}: PageLayoutProps) {
  return (
    <div className='relative isolate pb-8'>
      <PageHeader
        action={action}
        description={description}
        title={title}
        overlap
      />
      <PageContent className={contentClassName}>{children}</PageContent>
    </div>
  );
}
