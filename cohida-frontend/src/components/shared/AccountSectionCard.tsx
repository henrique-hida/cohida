import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AccountSectionCardProps {
  action?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  description: ReactNode;
  title: ReactNode;
}

export function AccountSectionCard({
  action,
  children,
  contentClassName,
  description,
  title,
}: AccountSectionCardProps) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b border-border px-5 pt-3 pb-4 sm:px-6 sm:pt-4">
        <div className="min-w-0">
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardHeader>
      <CardContent className={cn("p-5 sm:p-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
