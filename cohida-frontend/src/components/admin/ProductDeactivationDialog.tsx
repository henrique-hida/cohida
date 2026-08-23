import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { adminProductDeactivationOptions } from "@/mocks";

interface ProductDeactivationDialogProps {
  onClose: () => void;
  productName: string;
}

export function ProductDeactivationDialog({
  onClose,
  productName,
}: ProductDeactivationDialogProps) {
  const [confirmed, setConfirmed] = useState(false);

  function deactivate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfirmed(true);
  }

  return (
    <div
      aria-labelledby="deactivation-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/45 p-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
      role="dialog"
    >
      <form
        className="w-full max-w-lg rounded-xl bg-card p-6 text-card-foreground shadow-xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-2 motion-safe:duration-200"
        onSubmit={deactivate}
      >
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-10 place-items-center rounded-lg bg-warning text-warning-foreground">
            <AlertTriangle aria-hidden="true" className="size-5" />
          </span>
          <Button
            aria-label="Fechar"
            onClick={onClose}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X />
          </Button>
        </div>
        <h2 className="mt-4 text-xl font-semibold" id="deactivation-title">
          Desativar produto
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Informe o motivo para desativar{" "}
          <span className="font-medium text-foreground">{productName}</span>. A
          regra será validada pelo domínio quando a API for conectada.
        </p>
        {confirmed ? (
          <p className="mt-4 rounded-lg bg-success p-3 text-sm text-success-foreground">
            Desativação registrada apenas na interface.
          </p>
        ) : null}
        <div className="mt-5 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium">
              Categoria da desativação
            </span>
            <select
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue=""
              required
            >
              <option disabled value="">
                Selecione uma categoria
              </option>
              {adminProductDeactivationOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Motivo</span>
            <textarea
              className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="Descreva o motivo da desativação."
              required
            />
          </label>
          <p className="rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">
            <strong className="text-foreground">Desativação automática:</strong>{" "}
            produtos sem estoque e sem vendas abaixo do parâmetro do sistema
            devem receber a categoria{" "}
            <strong className="text-foreground">FORA DE MERCADO</strong>.
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="outline">
            Cancelar
          </Button>
          <Button type="submit" variant="destructive">
            Confirmar desativação
          </Button>
        </div>
      </form>
    </div>
  );
}
