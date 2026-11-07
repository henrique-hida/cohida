import { useEffect, useState } from "react";
import { ChevronLeft, PackageCheck } from "lucide-react";
import { Link, useParams } from "react-router";

import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { commerceStatus } from "@/lib/commerceStatus";
import { commerceApi, type ApiOrder, type ApiReturn } from "@/lib/commerceApi";
import { StatusMessage } from "@/components/ui/status-message";

export function AdminExchangeDetailPage() {
  const { exchangeId } = useParams();
  const [request, setRequest] = useState<ApiReturn | null>(null);
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [returnToStock, setReturnToStock] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmingCompletion, setConfirmingCompletion] = useState(false);
  const [confirmingDenial, setConfirmingDenial] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([commerceApi.adminReturns(), commerceApi.adminOrders()])
      .then(([returns, orders]) => {
        if (!active) return;
        const found =
          returns.find((entry) => String(entry.id) === exchangeId) ?? null;
        setRequest(found);
        setOrder(
          found
            ? (orders.find((entry) => entry.id === found.orderId) ?? null)
            : null,
        );
      })
      .catch((cause: Error) => active && setError(cause.message));
    return () => {
      active = false;
    };
  }, [exchangeId]);

  async function update(
    status: "TROCA_AUTORIZADA" | "TROCA_NEGADA" | "TROCADO",
  ) {
    if (!request) return;
    setError("");
    try {
      const updated = await commerceApi.updateReturnStatus(
        String(request.id),
        status,
        status === "TROCADO" ? returnToStock : undefined,
      );
      setRequest(updated);
      setMessage(
        status === "TROCA_AUTORIZADA"
          ? "Troca autorizada e cliente notificado."
          : status === "TROCA_NEGADA"
            ? "Troca negada e cliente notificado."
            : "Recebimento confirmado; cupom de troca emitido para o cliente.",
      );
    } catch (cause) {
      const errorMessage =
        cause instanceof Error
          ? cause.message
          : "Não foi possível atualizar a troca.";
      setError(
        errorMessage === "Já existe um registro com esses dados."
          ? "Não foi possível atualizar o status da troca. Atualize a página e tente novamente."
          : errorMessage,
      );
    }
  }

  if (error && !request)
    return (
      <AdminPageLayout
        description="Não foi possível abrir os dados desta solicitação."
        title="Troca"
      >
        <p className="rounded-lg border border-danger-border bg-danger-bg p-4 text-danger-foreground">
          {error}
        </p>
      </AdminPageLayout>
    );
  if (!request)
    return (
      <AdminPageLayout
        description="Consulte a solicitação e atualize o recebimento dos itens."
        title="Troca"
      >
        <p className="text-muted-foreground">Carregando troca...</p>
      </AdminPageLayout>
    );
  const item = request.orderItemId
    ? order?.items.find(
        (entry) => String(entry.id) === String(request.orderItemId),
      )
    : null;
  const valueCents = request.orderItemId
    ? (item?.unitPriceCents ?? 0) * (item?.quantity ?? 1)
    : (order?.subtotalCents ?? 0);

  return (
    <AdminPageLayout
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            render={<Link to="/admin/trocas" />}
            size="sm"
            variant="outline"
          >
            <ChevronLeft /> Trocas
          </Button>
          {request.status === "EM_TROCA" ? (
            <>
              <Button
                onClick={() => void update("TROCA_AUTORIZADA")}
                variant="outline"
              >
                Autorizar troca
              </Button>
              <Button
                onClick={() => setConfirmingDenial(true)}
                variant="destructive"
              >
                Negar troca
              </Button>
            </>
          ) : null}
          {request.status === "TROCA_AUTORIZADA" ? (
            <Button
              onClick={() => setConfirmingCompletion(true)}
              variant="outline"
            >
              <PackageCheck /> Confirmar recebimento
            </Button>
          ) : null}
        </div>
      }
      description={`Pedido #${request.orderId}${order ? ` · ${order.customerName}` : ""}`}
      title={
        <span className="flex flex-wrap items-center gap-3">
          Troca #{request.id}
          <Badge variant={commerceStatus(request.status).variant}>
            {commerceStatus(request.status).label}
          </Badge>
        </span>
      }
    >
      {message ? (
        <div className="mt-6">
          <StatusMessage
            key={message}
            message={message}
            onDismiss={() => setMessage("")}
            variant="success"
          />
        </div>
      ) : null}
      {error ? (
        <div className="mt-4">
          <StatusMessage message={error} variant="danger" />
        </div>
      ) : null}
      {confirmingCompletion ? (
        <ConfirmDialog
          confirmLabel="Confirmar recebimento"
          description="A confirmação gera o cupom ao cliente e devolve o item ao estoque se selecionado."
          onCancel={() => setConfirmingCompletion(false)}
          onConfirm={() => {
            void update("TROCADO");
            setConfirmingCompletion(false);
          }}
          title="Confirmar itens recebidos?"
        />
      ) : null}
      {confirmingDenial ? (
        <ConfirmDialog
          confirmLabel="Negar troca"
          description="O cliente será notificado de que a solicitação foi negada. Essa decisão não poderá ser desfeita."
          onCancel={() => setConfirmingDenial(false)}
          onConfirm={() => {
            void update("TROCA_NEGADA");
            setConfirmingDenial(false);
          }}
          title="Negar esta solicitação?"
        />
      ) : null}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Solicitação</CardTitle>
            <CardDescription>Dados enviados pelo cliente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Escopo</p>
              <p className="mt-1 font-medium">
                {request.orderItemId
                  ? (item?.productName ?? "Item do pedido")
                  : "Compra inteira"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor elegível</p>
              <p className="mt-1 text-lg font-semibold">
                {formatCurrency(valueCents)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Motivo</p>
              <p className="mt-1">{request.reason}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recebimento</CardTitle>
            <CardDescription>
              Apenas disponível após a autorização.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-3 rounded-lg border border-input p-3 text-sm">
              <input
                checked={returnToStock}
                className="size-4 accent-primary"
                disabled={request.status !== "TROCA_AUTORIZADA"}
                onChange={(event) => setReturnToStock(event.target.checked)}
                type="checkbox"
              />
              <span>
                <span className="block font-medium">Retornar ao estoque</span>
                <span className="text-muted-foreground">
                  A reentrada é registrada ao confirmar o recebimento.
                </span>
              </span>
            </label>
            {request.couponCode ? (
              <div className="mt-4">
                <StatusMessage
                  message={`Cupom emitido: ${request.couponCode}`}
                  variant="success"
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
