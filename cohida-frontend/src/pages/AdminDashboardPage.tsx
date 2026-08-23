import { ArrowUpRight, CircleAlert, PackagePlus } from "lucide-react";
import { Link } from "react-router";

import { AdminLayout } from "@/components/admin/AdminLayout";
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
  adminDashboardMetrics,
  adminLowStockProducts,
  adminRecentOrders,
} from "@/mocks";

function statusVariant(status: string) {
  return status === "EM PROCESSAMENTO"
    ? "warning"
    : status === "APROVADA"
      ? "success"
      : "info";
}

export function AdminDashboardPage() {
  return (
    <AdminLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">
            Domingo, 23 de agosto
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Bom dia, Marina.
          </h1>
          <p className="mt-2 text-muted-foreground">
            Acompanhe o que precisa de atenção na operação.
          </p>
        </div>
        <Button render={<Link to="/admin/produtos" />}>
          <PackagePlus aria-hidden="true" />
          Novo produto
        </Button>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminDashboardMetrics.map(
          ({ detail, icon: Icon, label, to, value }) => (
            <Link
              className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              key={label}
              to={to}
            >
              <Card className="h-full transition-transform group-hover:-translate-y-0.5 group-hover:ring-primary/60">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardDescription>{label}</CardDescription>
                    <Icon aria-hidden="true" className="size-4 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{detail}</p>
                </CardContent>
              </Card>
            </Link>
          ),
        )}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Pedidos recentes</CardTitle>
              <CardDescription>
                Pedidos que precisam de acompanhamento.
              </CardDescription>
            </div>
            <Button
              render={<Link to="/admin/pedidos" />}
              size="sm"
              variant="ghost"
            >
              Ver todos <ArrowUpRight />
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="pb-3 font-medium">Pedido</th>
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {adminRecentOrders.map((order) => (
                  <tr
                    className="border-b border-border last:border-0"
                    key={order.id}
                  >
                    <td className="py-4 font-medium">{order.id}</td>
                    <td className="py-4">{order.customer}</td>
                    <td className="py-4">
                      <Badge variant={statusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-4 text-right font-medium">
                      {order.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="bg-warning text-warning-foreground ring-0">
          <CardHeader>
            <span className="mb-2 grid size-10 place-items-center rounded-lg bg-warning-foreground text-warning">
              <CircleAlert className="size-5" />
            </span>
            <CardTitle className="text-warning-foreground">
              Estoque pede atenção
            </CardTitle>
            <CardDescription className="text-warning-foreground/75">
              Três itens estão abaixo do estoque mínimo configurado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {adminLowStockProducts.map((product) => (
              <div
                className="flex items-center justify-between border-b border-warning-foreground/15 pb-3 text-sm last:border-0"
                key={product.name}
              >
                <span>{product.name}</span>
                <span className="font-medium">{product.quantity} un.</span>
              </div>
            ))}
            <Button
              className="mt-2 w-full bg-warning-foreground text-warning hover:bg-warning-foreground/90"
              render={<Link to="/admin/estoque" />}
            >
              Ver estoque
            </Button>
          </CardContent>
        </Card>
      </section>
    </AdminLayout>
  );
}
