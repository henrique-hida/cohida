import { Package } from "lucide-react";
import { useState } from "react";
import { Link, Navigate } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/Pagination";
import { AccountSectionCard } from "@/components/shared/AccountSectionCard";
import { useCommerce } from "@/data/useCommerce";
import { formatCurrency } from "@/lib/currency";

const statusLabel = {
  approved: "Aprovado",
  delivered: "Entregue",
  in_transit: "Em trânsito",
  processing: "Em processamento",
  rejected: "Reprovado",
  in_exchange: "Em troca",
  exchange_authorized: "Troca autorizada",
  exchanged: "Trocado",
};

export function OrdersPage() {
  return <Navigate replace to="/conta?secao=orders" />;
}

export function OrdersSection() {
  const { state } = useCommerce();
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(state.orders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const orders = state.orders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <AccountSectionCard
      description="Acompanhe seus pedidos e entregas."
      title="Meus pedidos"
    >
      {state.orders.length ? (
        <div className="divide-y divide-border">
          {orders.map((order) => (
            <Link
              className="flex flex-col gap-4 py-4 outline-none first:pt-0 last:pb-0 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between"
              key={order.id}
              to={`/pedidos/${order.id}`}
            >
              <div className="flex items-center gap-4">
                <span className="grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <Package className="size-5" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{order.id}</h3>
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
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="py-2 text-sm text-muted-foreground">
          Você ainda não fez nenhum pedido.
        </p>
      )}
      <Pagination
        currentPage={currentPage}
        onPageChange={setPage}
        pageSize={pageSize}
        totalItems={state.orders.length}
      />
    </AccountSectionCard>
  );
}
