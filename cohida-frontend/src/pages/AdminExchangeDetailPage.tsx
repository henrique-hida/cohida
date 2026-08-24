import { useState } from "react";
import { Check, ChevronLeft, PackageCheck } from "lucide-react";
import { Link, useParams } from "react-router";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StatusTimeline } from "@/components/admin/StatusTimeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  adminExchanges,
  adminExchangeStatusSteps,
  type AdminExchangeStatus,
} from "@/mocks";

export function AdminExchangeDetailPage() {
  const { exchangeId } = useParams();
  const exchange =
    adminExchanges.find((item) => item.id === exchangeId) ?? adminExchanges[0];
  const [status, setStatus] = useState<AdminExchangeStatus>(exchange.status);
  const [returnToStock, setReturnToStock] = useState(true);
  const [message, setMessage] = useState("");
  const [confirmingCompletion, setConfirmingCompletion] = useState(false);
  const next =
    status === "TROCA ACEITA"
      ? (["Registrar despacho", "ITEM ENVIADO"] as const)
      : status === "ITEM ENVIADO"
        ? (["Confirmar recebimento", "ITEM RECEBIDO"] as const)
        : status === "ITEM RECEBIDO"
          ? (["Processar troca", "TROCA PROCESSADA"] as const)
          : undefined;
  function advance() {
    if (next) {
      setStatus(next[1]);
      setMessage(
        next[1] === "ITEM RECEBIDO"
          ? "Recebimento confirmado. Cupom de troca disponível."
          : "Troca atualizada apenas na interface.",
      );
    }
  }
  return (
    <AdminLayout>
      <Button render={<Link to="/admin/trocas" />} size="sm" variant="ghost">
        <ChevronLeft />
        Trocas
      </Button>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              Troca #{exchange.id}
            </h1>
            <Badge
              variant={
                status === "TROCA SOLICITADA"
                  ? "warning"
                  : status === "TROCA PROCESSADA"
                    ? "success"
                    : "info"
              }
            >
              {status}
            </Badge>
          </div>
          <p className="mt-2 text-muted-foreground">
            Pedido #{exchange.orderId} · {exchange.customer}
          </p>
        </div>
        {status === "TROCA SOLICITADA" ? (
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setStatus("TROCA ACEITA");
                setMessage("Troca aceita.");
              }}
            >
              Aceitar troca
            </Button>
            <Button
              onClick={() => {
                setStatus("TROCA NEGADA");
                setMessage("Troca negada.");
              }}
              variant="destructive"
            >
              Negar troca
            </Button>
          </div>
        ) : null}
        {next ? (
          <Button
            onClick={() =>
              next[1] === "TROCA PROCESSADA"
                ? setConfirmingCompletion(true)
                : advance()
            }
          >
            <PackageCheck />
            {next[0]}
          </Button>
        ) : null}
      </div>
      {message ? (
        <div className="mt-6 flex gap-3 rounded-xl bg-success p-4 text-sm text-success-foreground">
          <Check className="size-5" />
          {message}
        </div>
      ) : null}
      {confirmingCompletion ? (
        <ConfirmDialog
          confirmLabel="Concluir troca"
          description="A conclusão registra a decisão de devolver ou não o item ao estoque."
          onCancel={() => setConfirmingCompletion(false)}
          onConfirm={() => {
            advance();
            setConfirmingCompletion(false);
          }}
          title="Concluir esta troca?"
        />
      ) : null}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Item solicitado</CardTitle>
              <CardDescription>
                Informações do pedido e motivo informado pelo cliente.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Produto</p>
                <p className="mt-1 font-medium">{exchange.item}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor elegível</p>
                <p className="mt-1 text-lg font-semibold">{exchange.value}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Motivo</p>
                <p className="mt-1">{exchange.reason}</p>
              </div>
            </CardContent>
          </Card>
          {status === "ITEM RECEBIDO" || status === "TROCA PROCESSADA" ? (
            <Card>
              <CardHeader>
                <CardTitle>Destino do item</CardTitle>
                <CardDescription>
                  Defina se o produto recebido retorna ao estoque.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <label className="flex items-center gap-3 rounded-lg border border-input p-3 text-sm">
                  <input
                    checked={returnToStock}
                    className="size-4 accent-primary"
                    onChange={(event) => setReturnToStock(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    <span className="block font-medium">
                      Retornar ao estoque
                    </span>
                    <span className="text-muted-foreground">
                      A decisão será registrada com a conclusão da troca.
                    </span>
                  </span>
                </label>
                {status === "ITEM RECEBIDO" ? (
                  <div className="mt-4 rounded-lg bg-info p-3 text-sm text-info-foreground">
                    Cupom de troca de {exchange.value} gerado para o cliente.
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Linha do tempo</CardTitle>
            <CardDescription>Fluxo autorizado da solicitação.</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusTimeline
              currentStatus={status}
              steps={adminExchangeStatusSteps}
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
