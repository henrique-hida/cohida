import { useEffect, useState } from "react";
import { ChevronLeft, PackageCheck, Truck } from "lucide-react";
import { Link, useParams } from "react-router";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusMessage } from "@/components/ui/status-message";
import { formatCurrency } from "@/lib/currency";
import { commerceStatus } from "@/lib/commerceStatus";
import {
  commerceApi,
  resolveProductImageUrl,
  type ApiOrder,
  type ApiProduct,
} from "@/lib/commerceApi";

export function AdminOrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [trackingCode, setTrackingCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  useEffect(() => {
    void Promise.all([
      commerceApi.adminOrders(),
      commerceApi.adminProducts().catch(() => []),
    ])
      .then(([orders, catalog]) => {
        setOrder(orders.find((entry) => String(entry.id) === orderId) ?? null);
        setProducts(catalog);
      })
      .catch((cause: Error) => setError(cause.message));
  }, [orderId]);
  async function dispatch() {
    if (!order) return;
    try {
      setOrder(await commerceApi.dispatchOrder(String(order.id), trackingCode));
      setMessage("Pedido despachado e cliente notificado.");
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Não foi possível despachar.",
      );
    }
  }
  async function deliver() {
    if (!order) return;
    try {
      setOrder(
        await commerceApi.updateOrderStatus(String(order.id), "ENTREGUE"),
      );
      setMessage("Entrega confirmada.");
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível confirmar a entrega.",
      );
    }
  }
  if (error && !order)
    return (
      <AdminPageLayout
        description="Não foi possível abrir os dados deste pedido."
        title="Pedido"
      >
        <p className="rounded-lg bg-destructive p-4 text-destructive-foreground">
          {error}
        </p>
      </AdminPageLayout>
    );
  if (!order)
    return (
      <AdminPageLayout
        description="Consulte os itens, o pagamento e a entrega do pedido."
        title="Pedido"
      >
        <p className="text-muted-foreground">Carregando pedido...</p>
      </AdminPageLayout>
    );
  return (
    <AdminPageLayout
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            render={<Link to="/admin/pedidos" />}
            size="sm"
            variant="outline"
          >
            <ChevronLeft /> Pedidos
          </Button>
          {order.status === "APROVADA" ? (
            <input
              aria-label="Código de rastreio"
              className="h-11 min-w-0 rounded-lg border border-primary-foreground/40 bg-primary-foreground/10 px-3 text-sm text-primary-foreground shadow-sm backdrop-blur-md placeholder:text-primary-foreground/65 sm:w-48"
              onChange={(event) => setTrackingCode(event.target.value)}
              placeholder="Código de rastreio"
              value={trackingCode}
            />
          ) : null}
          {order.status === "APROVADA" ? (
            <Button
              disabled={!trackingCode.trim()}
              onClick={() => void dispatch()}
              size="sm"
              variant="outline"
            >
              <Truck /> Despachar
            </Button>
          ) : null}
          {order.status === "EM_TRANSITO" ? (
            <Button
              onClick={() => setConfirmingDelivery(true)}
              size="sm"
              variant="outline"
            >
              <PackageCheck /> Confirmar entrega
            </Button>
          ) : null}
        </div>
      }
      description={`Cliente: ${order.customerName} · ${order.items.length} itens no pedido`}
      title={
        <span className="flex flex-wrap items-center gap-3">
          Pedido #{order.id}
          <Badge variant={commerceStatus(order.status).variant}>
            {commerceStatus(order.status).label}
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
      {confirmingDelivery ? (
        <ConfirmDialog
          confirmLabel="Confirmar entrega"
          description="Esta ação só é permitida para pedidos em transporte."
          onCancel={() => setConfirmingDelivery(false)}
          onConfirm={() => {
            void deliver();
            setConfirmingDelivery(false);
          }}
          title="Confirmar entrega do pedido?"
        />
      ) : null}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Itens do pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items.map((item) => {
              const product = products.find((entry) =>
                entry.variants.some((variant) => variant.id === item.variantId),
              );
              const variant = product?.variants.find(
                (entry) => entry.id === item.variantId,
              );

              return (
                <div
                  className="flex flex-col gap-4 border-b border-border pb-4 text-sm last:border-0 sm:flex-row"
                  key={item.id ?? item.variantId}
                >
                  {product?.imageUrl ? (
                    <img
                      alt={item.productName}
                      className="size-20 shrink-0 rounded-lg border border-border bg-muted object-cover"
                      src={resolveProductImageUrl(product.imageUrl)}
                    />
                  ) : null}
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-semibold">{item.productName}</p>
                    {product ? (
                      <>
                        <p className="text-muted-foreground">
                          Marca: {product.brand}
                        </p>
                        {product.categories.length ? (
                          <p className="text-muted-foreground">
                            Categorias: {product.categories.join(", ")}
                          </p>
                        ) : null}
                        {product.description ? (
                          <p className="line-clamp-2 text-muted-foreground">
                            {product.description}
                          </p>
                        ) : null}
                      </>
                    ) : null}
                    <p className="text-muted-foreground">
                      Variação: {item.variantLabel}
                      {variant?.color ? ` · ${variant.color}` : ""}
                      {variant?.size ? ` · ${variant.size}` : ""}
                    </p>
                    <p className="text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  <div className="flex shrink-0 flex-row justify-between gap-4 sm:flex-col sm:items-end sm:justify-start">
                    <span className="text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.unitPriceCents)}
                    </span>
                    <strong>
                      {formatCurrency(item.unitPriceCents * item.quantity)}
                    </strong>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pagamento e entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotalCents)}</span>
            </div>
            <div className="flex justify-between">
              <span>Frete</span>
              <span>{formatCurrency(order.shippingCents)}</span>
            </div>
            <div className="flex justify-between">
              <span>Desconto</span>
              <span>-{formatCurrency(order.discountCents)}</span>
            </div>
            <div className="flex justify-between border-t pt-3 font-semibold">
              <span>Total</span>
              <span>{formatCurrency(order.totalCents)}</span>
            </div>
            <p className="border-t pt-3 text-muted-foreground">
              {order.deliveryLabel}: {order.deliveryStreet},{" "}
              {order.deliveryNumber} — {order.deliveryCity}/
              {order.deliveryState}
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
