import type { ReactNode } from "react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";

type AdminPageLayoutProps = {
  title: ReactNode;
  description: ReactNode;
  eyebrow?: ReactNode;
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
  eyebrow,
  action,
  children,
}: AdminPageLayoutProps) {
  return (
    <AdminLayout>
      <div className="relative isolate min-h-full pb-8">
        <PageHeader
          action={action}
          description={description}
          eyebrow={eyebrow}
          title={title}
        />
        <div className="relative z-10 mx-auto -mt-9 w-full max-w-7xl space-y-8 px-5 sm:px-8 sm:-mt-12">
          {children}
        </div>
      </div>
    </AdminLayout>
  );
}
