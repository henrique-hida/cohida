import {
  Check,
  ChevronLeft,
  CircleHelp,
  MapPin,
  PackageCheck,
  Truck,
} from "lucide-react";
import { Link, useParams } from "react-router";

import { PageContainer, StoreHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { products } from "@/mocks";
import { useCommerce } from "@/data/useCommerce";

const deliverySteps = [
  { icon: Check, label: "Pedido confirmado" },
  { icon: PackageCheck, label: "Preparando envio" },
  { icon: Truck, label: "Em transporte" },
  { icon: MapPin, label: "Entregue" },
];

export function OrderDetailPage() {
  const { cancelOrder, confirmReceipt, state } = useCommerce();
  const { orderId } = useParams();
  const order = state.orders.find((entry) => entry.id === orderId);
  if (!order)
    return (
      <div className="min-h-svh bg-background">
        <StoreHeader />
        <PageContainer className="py-20 text-center">
          <h1 className="text-2xl font-semibold">Pedido não encontrado</h1>
          <Button className="mt-5" render={<Link to="/pedidos" />}>
            Ver pedidos
          </Button>
        </PageContainer>
      </div>
    );
  const currentStep =
    order.status === "delivered" ? 3 : order.status === "in_transit" ? 2 : 1;
  return (
    <div className="min-h-svh bg-background">
      <StoreHeader />
      <PageContainer className="py-8 sm:py-12">
        <Button render={<Link to="/pedidos" />} size="sm" variant="ghost">
          <ChevronLeft />
          Meus pedidos
        </Button>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">
              Pedido {order.id}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Acompanhe sua entrega
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Realizado em{" "}
            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
              new Date(order.createdAt),
            )}
          </p>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="grid gap-6">
            <Card>
              <CardContent className="p-5 sm:p-6">
                <h2 className="font-semibold">Status do pedido</h2>
                <ol className="mt-6 grid gap-5 sm:grid-cols-4">
                  {deliverySteps.map((step, index) => {
                    const Icon = step.icon;
                    const isDone = index <= currentStep;
                    return (
                      <li
                        className="relative flex gap-3 sm:block"
                        key={step.label}
                      >
                        <span
                          className={`grid size-8 place-items-center rounded-full ${isDone ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                        >
                          <Icon className="size-4" />
                        </span>
                        <p
                          className={`mt-1 text-sm font-medium sm:mt-3 ${isDone ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {step.label}
                        </p>
                      </li>
                    );
                  })}
                </ol>
                {order.status === "in_transit" ? (
                  <div className="mt-6 rounded-lg bg-muted p-4 text-sm">
                    <p className="font-medium">
                      Previsão de entrega: 26 de agosto
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Seu pedido está a caminho de Vila Mariana, São Paulo - SP.
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 sm:p-6">
                <h2 className="font-semibold">Itens do pedido</h2>
                <div className="mt-5 grid gap-4">
                  {order.items.map((item) => {
                    const product = products.find(
                      (entry) => entry.id === item.productId,
                    );
                    return product ? (
                      <div className="flex gap-4" key={item.id}>
                        <img
                          alt={product.images[0]?.alt}
                          className="size-16 rounded-lg bg-muted object-cover"
                          src={product.images[0]?.src}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{product.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Quantidade: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">
                          {formatCurrency(item.unitPriceCents * item.quantity)}
                        </p>
                      </div>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold">Resumo</h2>
              <dl className="mt-5 grid gap-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <dt>Subtotal</dt>
                  <dd>{formatCurrency(order.subtotalCents)}</dd>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <dt>Entrega</dt>
                  <dd>{formatCurrency(order.shippingCents)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                  <dt>Total</dt>
                  <dd>{formatCurrency(order.totalCents)}</dd>
                </div>
              </dl>
              {order.status === "delivered" ? (
                <Button
                  className="mt-6 w-full"
                  render={<Link to={`/trocas?pedido=${order.id}`} />}
                  variant="outline"
                >
                  <CircleHelp />
                  Solicitar troca
                </Button>
              ) : null}
              {order.status === "in_transit" ? (
                <Button
                  className="mt-3 w-full"
                  onClick={() => confirmReceipt(order.id)}
                  variant="outline"
                >
                  Confirmar recebimento
                </Button>
              ) : null}
              {order.status === "processing" ? (
                <Button
                  className="mt-3 w-full"
                  onClick={() => cancelOrder(order.id)}
                  variant="destructive"
                >
                  Cancelar pedido
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}
