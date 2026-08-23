import { ChevronRight, Package } from "lucide-react";
import { Link } from "react-router";

import { PageContainer, StoreHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { customerOrders } from "@/mocks";

const statusLabel = {
  approved: "Aprovado",
  delivered: "Entregue",
  in_transit: "Em transporte",
  processing: "Em processamento",
  rejected: "Reprovado",
  in_exchange: "Em troca",
  exchange_authorized: "Troca autorizada",
  exchanged: "Trocado",
};

export function OrdersPage() {
  return (
    <div className="min-h-svh bg-background">
      <StoreHeader />
      <PageContainer className="py-10 sm:py-14">
        <p className="text-sm font-medium text-primary">Minha conta</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Meus pedidos
        </h1>
        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
          {customerOrders.map((order) => (
            <article
              className="flex flex-col gap-4 border-b border-border p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              key={order.id}
            >
              <div className="flex items-center gap-4">
                <span className="grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <Package className="size-5" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{order.id}</h2>
                    <Badge
                      variant={
                        order.status === "delivered" ? "secondary" : "default"
                      }
                    >
                      {statusLabel[order.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "long",
                    }).format(new Date(order.createdAt))}{" "}
                    · {order.items.length}{" "}
                    {order.items.length === 1 ? "item" : "itens"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <p className="font-semibold">
                  {formatCurrency(order.totalCents)}
                </p>
                <Button
                  render={<Link to={`/pedidos/${order.id}`} />}
                  size="sm"
                  variant="outline"
                >
                  Ver pedido <ChevronRight />
                </Button>
              </div>
            </article>
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
