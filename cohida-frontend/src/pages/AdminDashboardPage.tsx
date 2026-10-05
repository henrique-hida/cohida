import {
  ArrowUpRight,
  Boxes,
  CircleAlert,
  ClipboardCheck,
  PackagePlus,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
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
  commerceApi,
  type ApiOrder,
  type ApiProduct,
  type ApiReturn,
} from "@/lib/commerceApi";
import { formatCurrency } from "@/lib/currency";

function statusVariant(status: string) {
  return status === "EM_PROCESSAMENTO"
    ? "warning"
    : status === "PAGAMENTO_REALIZADO"
      ? "success"
      : "info";
}

function getGreeting(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function AdminDashboardPage() {
  const greeting = getGreeting(new Date().getHours());
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [returns, setReturns] = useState<ApiReturn[]>([]);

  useEffect(() => {
    void Promise.all([
      commerceApi.adminOrders(),
      commerceApi.adminProducts(),
      commerceApi.adminReturns(),
    ]).then(([nextOrders, nextProducts, nextReturns]) => {
      setOrders(nextOrders);
      setProducts(nextProducts);
      setReturns(nextReturns);
    });
  }, []);

  const lowStockProducts = products.flatMap((product) => {
    const quantity = product.variants.reduce(
      (total, variant) => total + variant.stockQuantity,
      0,
    );
    return quantity <= product.minimumStock
      ? [{ minimum: product.minimumStock, name: product.name, quantity }]
      : [];
  });
  const recentOrders = orders.slice(0, 3);
  const revenueCents = orders
    .filter((order) => order.status !== "CANCELADO")
    .reduce((total, order) => total + order.totalCents, 0);
  const todayOrders = orders.filter(
    (order) =>
      new Date(order.createdAt).toDateString() === new Date().toDateString(),
  ).length;
  const openReturns = returns.filter(
    (request) => !["NEGADA", "PROCESSADA"].includes(request.status),
  ).length;
  const metrics = [
    { detail: "Pedidos não cancelados", icon: TrendingUp, label: "Faturamento", to: "/admin/analises", value: formatCurrency(revenueCents) },
    { detail: "Criados hoje", icon: ClipboardCheck, label: "Pedidos hoje", to: "/admin/pedidos", value: String(todayOrders) },
    { detail: "No limite mínimo", icon: CircleAlert, label: "Alertas de estoque", to: "/admin/estoque", value: String(lowStockProducts.length) },
    { detail: "Aguardando conclusão", icon: Boxes, label: "Trocas abertas", to: "/admin/trocas", value: String(openReturns) },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">
            Domingo, 23 de agosto
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {greeting}, Marina.
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
        {metrics.map(
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
                {recentOrders.map((order) => (
                  <tr
                    className="border-b border-border last:border-0"
                    key={order.id}
                  >
                    <td className="py-4 font-medium">#{order.id}</td>
                    <td className="py-4">{order.customerName}</td>
                    <td className="py-4">
                      <Badge variant={statusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-4 text-right font-medium">
                      {formatCurrency(order.totalCents)}
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
              Itens no limite mínimo configurado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockProducts.map((product) => (
              <div
                className="flex items-center justify-between border-b border-warning-foreground/15 pb-3 text-sm last:border-0"
                key={product.name}
              >
                <span>{product.name}</span>
                <span className="font-medium">
                  {product.quantity} / mín. {product.minimum} un.
                </span>
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
