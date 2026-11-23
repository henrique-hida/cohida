import type { ComponentProps } from 'react';

import { Page } from '@/components/shared/Page';
import { cn } from '@/lib/utils';

type AdminPageProps = ComponentProps<typeof Page>;

export function AdminPage({ contentClassName, ...props }: AdminPageProps) {
  return (
    <Page {...props} contentClassName={cn('space-y-8', contentClassName)} />
  );
}
