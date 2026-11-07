import {
  Check,
  ChevronLeft,
  CircleHelp,
  Clock3,
  MapPin,
  PackageCheck,
  Truck,
} from "lucide-react";
import { Link, useParams } from "react-router";

import { PageContainer, StoreHeader } from "@/components/shared";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { useCommerce } from "@/data/useCommerce";

const deliverySteps = [
  { icon: Check, label: "Pedido confirmado" },
  { icon: PackageCheck, label: "Preparando envio" },
  { icon: Truck, label: "Em transporte" },
  { icon: MapPin, label: "Entregue" },
];

function addBusinessDays(date: Date, days: number) {
  const result = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0 && result.getDay() !== 6) addedDays += 1;
  }

  return result;
}

export function OrderDetailPage() {
  const { cancelOrder, state } = useCommerce();
  const { orderId } = useParams();
  const order = state.orders.find((entry) => entry.id === orderId);
  if (!order)
    return (
      <div className="min-h-svh bg-background">
        <StoreHeader />
        <PageHeader
          action={
            <Button
              render={<Link to="/conta?secao=orders" />}
              variant="outline"
            >
              <ChevronLeft />
              Meus pedidos
            </Button>
          }
          description="Não foi possível encontrar este pedido na sua conta."
          title="Pedido não encontrado"
        />
        <PageContainer className="py-20 text-center">
          <p className="text-muted-foreground">
            Confira seus pedidos e selecione um para acompanhar.
          </p>
        </PageContainer>
      </div>
    );
  const currentStep =
    order.status === "delivered"
      ? 3
      : order.status === "in_transit"
        ? 2
        : order.status === "approved"
          ? 1
          : 0;
  const statusDates = [
    order.createdAt,
    order.approvedAt,
    order.dispatchedAt,
    order.deliveredAt,
  ];
  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  });
  const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
    timeStyle: "short",
  });
  const estimatedDeliveryDate = addBusinessDays(
    new Date(order.dispatchedAt ?? order.approvedAt ?? order.createdAt),
    5,
  );
  return (
    <div className="min-h-svh bg-background">
      <StoreHeader />
      <div className="relative isolate pb-8">
        <PageHeader
          action={
            <Button
              render={<Link to="/conta?secao=orders" />}
              variant="outline"
            >
              <ChevronLeft />
              Meus pedidos
            </Button>
          }
          description={`Realizado em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(order.createdAt))}`}
          eyebrow={`Pedido ${order.id}`}
          title="Acompanhe sua entrega"
        />
        <PageContainer className="relative z-10 -mt-9 px-5 sm:-mt-12 sm:px-8">
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <div className="grid gap-6">
              <Card className="py-0">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold">Acompanhamento</h2>
                    <span className="text-xs font-medium text-muted-foreground">
                      Etapa {currentStep + 1} de {deliverySteps.length}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-background/80 px-4 py-3 sm:px-5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      {order.status === "delivered" ? (
                        <MapPin className="size-5" />
                      ) : (
                        <Clock3 className="size-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {order.status === "delivered"
                          ? "Entrega concluída"
                          : "Previsão da entrega"}
                      </p>
                      <p className="mt-0.5 font-semibold text-primary">
                        {dateFormatter.format(
                          order.deliveredAt
                            ? new Date(order.deliveredAt)
                            : estimatedDeliveryDate,
                        )}
                      </p>
                    </div>
                  </div>
                  <ol className="mt-6">
                    {deliverySteps.map((step, index) => {
                      const Icon = step.icon;
                      const isDone = index <= currentStep;
                      return (
                        <li
                          className="relative flex gap-4 pb-7 last:pb-0"
                          key={step.label}
                        >
                          {index < deliverySteps.length - 1 ? (
                            <span
                              aria-hidden="true"
                              className="absolute top-8 bottom-0 left-4 z-0 w-0.5 bg-muted"
                            >
                              <span
                                className={`block h-full ${index < currentStep ? "w-full bg-primary" : "w-0"}`}
                              />
                            </span>
                          ) : null}
                          <span
                            className={`relative z-10 grid size-8 place-items-center rounded-full ${isDone ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                          >
                            <Icon className="size-4" />
                          </span>
                          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <p
                              className={`pt-1 text-sm font-medium ${isDone ? "text-foreground" : "text-muted-foreground"}`}
                            >
                              {step.label}
                            </p>
                            <div className="text-sm text-muted-foreground sm:min-w-32 sm:text-right">
                              {statusDates[index]
                                ? (() => {
                                    const date = new Date(statusDates[index]);
                                    return (
                                      <time dateTime={date.toISOString()}>
                                        <span className="block">
                                          {dateFormatter.format(date)}
                                        </span>
                                        <span className="mt-0.5 block text-xs">
                                          {timeFormatter.format(date)}
                                        </span>
                                      </time>
                                    );
                                  })()
                                : isDone
                                  ? "Data indisponível"
                                  : "Aguardando"}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </CardContent>
              </Card>
            </div>
            <Card className="py-0">
              <CardContent className="p-5">
                <h2 className="font-semibold">Resumo do pedido</h2>
                <div className="mt-5 grid gap-4">
                  {order.items.map((item) => {
                    const product = state.products.find((entry) =>
                      entry.variants.some(
                        (variant) => variant.id === item.variantId,
                      ),
                    );
                    const variant = product?.variants.find(
                      (entry) => entry.id === item.variantId,
                    );
                    return (
                      <div className="flex min-w-0 gap-3" key={item.id}>
                        <img
                          alt={product?.images[0]?.alt ?? item.productId}
                          className="size-14 shrink-0 rounded-lg bg-muted object-cover"
                          src={product?.images[0]?.src}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {product?.name ?? item.productId}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {[variant?.label, variant?.sku]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          <div className="mt-2 flex justify-between gap-2 text-sm">
                            <span className="text-muted-foreground">
                              {item.quantity} ×{" "}
                              {formatCurrency(item.unitPriceCents)}
                            </span>
                            <span className="font-medium">
                              {formatCurrency(
                                item.unitPriceCents * item.quantity,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <dl className="mt-5 grid gap-3 border-t border-border pt-4 text-sm">
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
                {order.status === "processing" ? (
                  <Button
                    className="mt-3 w-full"
                    onClick={() => void cancelOrder(order.id)}
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
    </div>
  );
}
