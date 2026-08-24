import { CheckCircle2, ChevronLeft, PackageOpen, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import { PageContainer, StoreHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { products } from "@/mocks";
import { useCommerce } from "@/data/useCommerce";

const exchangeStatus = {
  authorized: "Troca autorizada",
  completed: "Troca concluída",
  received: "Recebimento confirmado",
  requested: "Solicitação enviada",
  sent: "Item despachado",
};

export function ExchangesPage() {
  const { dispatchExchange, requestExchange, state } = useCommerce();
  const [searchParams] = useSearchParams();
  const [isRequesting, setIsRequesting] = useState(
    Boolean(searchParams.get("pedido")),
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const deliveredOrders = state.orders.filter(
    (order) => order.status === "delivered",
  );
  return (
    <div className="min-h-svh bg-background">
      <StoreHeader />
      <PageContainer className="py-8 sm:py-12">
        <Button render={<Link to="/conta" />} size="sm" variant="ghost">
          <ChevronLeft />
          Minha conta
        </Button>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">
              Trocas e devoluções
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Acompanhe suas solicitações
            </h1>
          </div>
          <Button
            onClick={() => {
              setIsRequesting(true);
              setIsSubmitted(false);
            }}
          >
            <Plus />
            Solicitar troca
          </Button>
        </div>
        {isRequesting ? (
          <Card className="mt-8">
            <CardContent className="p-5 sm:p-6">
              {isSubmitted ? (
                <div className="py-4 text-center">
                  <CheckCircle2 className="mx-auto size-10 text-primary" />
                  <h2 className="mt-4 text-xl font-semibold">
                    Solicitação enviada
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Vamos analisar sua solicitação e avisaremos você por e-mail.
                  </p>
                  <Button
                    className="mt-5"
                    onClick={() => setIsRequesting(false)}
                  >
                    Ver solicitações
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold">Nova solicitação</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Apenas itens de pedidos entregues podem ser trocados.
                  </p>
                  <form
                    className="mt-6 grid gap-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      const orderId = String(formData.get("orderId") ?? "");
                      const order = deliveredOrders.find(
                        (entry) => entry.id === orderId,
                      );
                      const productId = order?.items[0]?.productId;
                      if (!productId) return;
                      requestExchange({
                        orderId,
                        productId,
                        reason: String(formData.get("reason") ?? ""),
                      });
                      setIsSubmitted(true);
                    }}
                  >
                    <label className="grid gap-2 text-sm font-medium">
                      Pedido
                      <select
                        className="h-10 rounded-lg border border-input bg-background px-3 font-normal"
                        defaultValue={
                          searchParams.get("pedido") ?? deliveredOrders[0]?.id
                        }
                        name="orderId"
                      >
                        {deliveredOrders.map((order) => (
                          <option key={order.id} value={order.id}>
                            {order.id}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Motivo
                      <select
                        className="h-10 rounded-lg border border-input bg-background px-3 font-normal"
                        name="reason"
                      >
                        <option>Tamanho ou variação incorreta</option>
                        <option>Produto diferente do esperado</option>
                        <option>Produto com defeito</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Conte um pouco mais
                      <textarea
                        className="min-h-24 rounded-lg border border-input bg-background p-3 font-normal"
                        placeholder="Descreva o que aconteceu"
                      />
                    </label>
                    <div className="flex gap-2">
                      <Button type="submit">Enviar solicitação</Button>
                      <Button
                        onClick={() => setIsRequesting(false)}
                        type="button"
                        variant="ghost"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        ) : null}
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Solicitações em andamento</h2>
          <div className="mt-4 grid gap-3">
            {state.exchanges.map((request) => {
              const product = products.find(
                (entry) => entry.id === request.productId,
              );
              return (
                <Card key={request.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-lg bg-muted">
                          <PackageOpen className="size-5 text-muted-foreground" />
                        </span>
                        <div>
                          <p className="font-medium">
                            {request.id} · {product?.name}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Pedido {request.orderId} · {request.reason}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{exchangeStatus[request.status]}</Badge>
                        {request.status === "authorized" ? (
                          <Button
                            onClick={() =>
                              setDispatchingId((current) =>
                                current === request.id ? null : request.id,
                              )
                            }
                            size="sm"
                            variant="outline"
                          >
                            Informar despacho
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    {dispatchingId === request.id ? (
                      <form
                        className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const form = new FormData(event.currentTarget);
                          dispatchExchange(request.id, {
                            carrier: String(form.get("carrier") ?? "").trim(),
                            notes: String(form.get("notes") ?? "").trim(),
                            postedAt: String(form.get("postedAt") ?? ""),
                            trackingCode: String(
                              form.get("trackingCode") ?? "",
                            ).trim(),
                          });
                          setDispatchingId(null);
                        }}
                      >
                        <p className="text-sm font-medium sm:col-span-2">
                          Dados do despacho
                        </p>
                        <label className="grid gap-1 text-sm">
                          Transportadora
                          <input
                            className="h-9 rounded-lg border border-input bg-background px-3"
                            name="carrier"
                            placeholder="Ex.: Correios"
                            required
                          />
                        </label>
                        <label className="grid gap-1 text-sm">
                          Código de rastreio
                          <input
                            className="h-9 rounded-lg border border-input bg-background px-3"
                            name="trackingCode"
                            placeholder="Ex.: AB123456789BR"
                            required
                          />
                        </label>
                        <label className="grid gap-1 text-sm">
                          Data de postagem
                          <input
                            className="h-9 rounded-lg border border-input bg-background px-3"
                            defaultValue={new Date().toISOString().slice(0, 10)}
                            name="postedAt"
                            required
                            type="date"
                          />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span className="flex items-center gap-1">
                            Observações
                            <span className="text-muted-foreground">
                              (opcional)
                            </span>
                          </span>
                          <input
                            className="h-9 rounded-lg border border-input bg-background px-3"
                            name="notes"
                            placeholder="Ex.: postagem em agência"
                          />
                        </label>
                        <div className="flex gap-2 sm:col-span-2">
                          <Button type="submit">Confirmar despacho</Button>
                          <Button
                            onClick={() => setDispatchingId(null)}
                            type="button"
                            variant="ghost"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    ) : null}
                    {request.dispatch ? (
                      <div className="mt-4 rounded-lg bg-muted/60 p-3 text-sm">
                        <p className="font-medium">Despacho informado</p>
                        <p className="mt-1 text-muted-foreground">
                          {request.dispatch.carrier} ·{" "}
                          {request.dispatch.trackingCode} · Postado em{" "}
                          {new Intl.DateTimeFormat("pt-BR").format(
                            new Date(`${request.dispatch.postedAt}T12:00:00`),
                          )}
                        </p>
                        {request.dispatch.notes ? (
                          <p className="mt-1 text-muted-foreground">
                            {request.dispatch.notes}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </PageContainer>
    </div>
  );
}
