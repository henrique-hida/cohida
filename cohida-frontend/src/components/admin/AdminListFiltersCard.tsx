import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

interface AdminListFiltersCardProps {
  children: ReactNode;
  className?: string;
}

export function AdminListFiltersCard({
  children,
  className,
}: AdminListFiltersCardProps) {
  return (
    <Card className={className}>
      <CardContent className="px-4 py-2 sm:px-5">{children}</CardContent>
    </Card>
  );
}
