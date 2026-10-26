import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

type StatusMessageVariant = "info" | "warning" | "danger" | "success";

interface StatusMessageProps {
  message: string;
  onDismiss?: () => void;
  variant: StatusMessageVariant;
}

const styles: Record<StatusMessageVariant, string> = {
  danger: "border-danger-border bg-danger-bg text-danger-foreground",
  info: "border-info-border bg-info-bg text-info-foreground",
  success: "border-success-border bg-success-bg text-success-foreground",
  warning: "border-warning-border bg-warning-bg text-warning-foreground",
};

const icons = {
  danger: CircleAlert,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
} satisfies Record<StatusMessageVariant, typeof Info>;

export function StatusMessage({
  message,
  onDismiss,
  variant,
}: StatusMessageProps) {
  const [visible, setVisible] = useState(true);
  const Icon = icons[variant];

  useEffect(() => {
    if (variant !== "success") return;

    const timeout = window.setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [message, onDismiss, variant]);

  if (!visible) return null;

  return (
    <div
      aria-live={
        variant === "danger" || variant === "warning" ? "assertive" : "polite"
      }
      className={`relative overflow-hidden rounded-xl border p-4 text-sm ${styles[variant]}`}
      role={variant === "info" || variant === "success" ? "status" : "alert"}
    >
      <div className="flex items-start gap-3">
        <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p>{message}</p>
      </div>
      {variant === "success" ? (
        <span
          aria-hidden="true"
          className="status-message-progress absolute inset-x-0 bottom-0 h-1 origin-left bg-current/35"
        />
      ) : null}
    </div>
  );
}
