import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  confirmLabel: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}

export function ConfirmDialog({
  confirmLabel,
  description,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  useEffect(() => {
    const escape = (event: KeyboardEvent) =>
      event.key === "Escape" && onCancel();
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [onCancel]);
  return (
    <div
      aria-labelledby="confirm-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/45 p-4"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <span className="grid size-10 place-items-center rounded-lg bg-warning text-warning-foreground">
            <AlertTriangle />
          </span>
          <Button
            aria-label="Fechar"
            onClick={onCancel}
            size="icon"
            variant="ghost"
          >
            <X />
          </Button>
        </div>
        <h2 className="mt-4 text-xl font-semibold" id="confirm-title">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onCancel} variant="outline">
            Cancelar
          </Button>
          <Button onClick={onConfirm} variant="destructive">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
