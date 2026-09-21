import { Check, CircleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";

type ToastVariant = "error" | "success";

interface ToastProps {
  message: string;
  onClose: () => void;
  variant?: ToastVariant;
}

const styles: Record<ToastVariant, string> = {
  error: "bg-error text-error-foreground",
  success: "bg-success text-success-foreground",
};

export function Toast({ message, onClose, variant = "success" }: ToastProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => {
        if (isClosing) {
          onClose();
        } else {
          setIsClosing(true);
        }
      },
      isClosing ? 200 : 5000,
    );

    return () => window.clearTimeout(timeout);
  }, [isClosing, onClose]);

  const Icon = variant === "success" ? Check : CircleAlert;

  return (
    <div
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={`fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl p-4 text-sm shadow-lg motion-safe:duration-200 ${styles[variant]} ${
        isClosing
          ? "motion-safe:animate-out motion-safe:fade-out-0 motion-safe:slide-out-to-bottom-2"
          : "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2"
      }`}
      role={variant === "error" ? "alert" : "status"}
    >
      <Icon className="size-5 shrink-0" />
      <span>{message}</span>
      <button
        aria-label="Fechar aviso"
        className="ml-auto -mr-1 shrink-0 rounded-md p-1 transition-colors hover:bg-current/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/50"
        onClick={() => setIsClosing(true)}
        type="button"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
