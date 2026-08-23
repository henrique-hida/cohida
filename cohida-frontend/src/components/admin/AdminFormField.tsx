import type { ReactNode } from "react";

export const adminInputClassName =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export const adminTextareaClassName =
  "min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export const adminSuccessNoticeClassName =
  "flex items-center gap-3 rounded-xl bg-success p-4 text-sm text-success-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-200";

interface AdminFormFieldProps {
  children: ReactNode;
  className?: string;
  label: string;
}

export function AdminFormField({
  children,
  className,
  label,
}: AdminFormFieldProps) {
  return (
    <label className={`space-y-2 ${className ?? ""}`}>
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
