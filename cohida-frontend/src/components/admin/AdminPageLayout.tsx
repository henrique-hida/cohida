import type { ReactNode } from 'react';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { PageLayout } from '@/components/shared/PageLayout';

type AdminPageLayoutProps = {
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

/**
 * Shared administrative page frame. It keeps the page title in the same
 * responsive banner while allowing each screen to supply its own content.
 */
export function AdminPageLayout({
  title,
  description,
  action,
  children,
}: AdminPageLayoutProps) {
  return (
    <AdminLayout>
      <PageLayout
        action={action}
        description={description}
        title={title}
        contentClassName='space-y-8'
      >
        {children}
      </PageLayout>
    </AdminLayout>
  );
}
