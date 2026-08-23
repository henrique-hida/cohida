import type { ReactNode } from "react";
import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";

type AdminDataStateProps = {
  action?: ReactNode;
  description: string;
  title: string;
  variant: "empty" | "error" | "loading";
};

const icons = {
  empty: Inbox,
  error: AlertCircle,
  loading: LoaderCircle,
};

export function AdminDataState({
  action,
  description,
  title,
  variant,
}: AdminDataStateProps) {
  const Icon = icons[variant];

  return (
    <div
      className="grid min-h-44 place-items-center px-4 py-10 text-center"
      role={variant === "error" ? "alert" : "status"}
    >
      <div className="max-w-sm">
        <Icon
          className={`mx-auto size-7 text-muted-foreground ${variant === "loading" ? "animate-spin" : ""}`}
        />
        <h2 className="mt-3 font-medium">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}
