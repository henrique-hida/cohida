import { useState } from "react";
import { Check, ChevronLeft, PackageCheck, Truck } from "lucide-react";
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
  adminOrders,
  adminOrderStatusSteps,
  type AdminOrderStatus,
} from "@/mocks";
import { useCommerce } from "@/data/useCommerce";

function statusVariant(status: AdminOrderStatus) {
  if (status === "EM PROCESSAMENTO") return "warning";
  if (status === "PAGAMENTO REALIZADO" || status === "ENTREGUE")
    return "success";
  return "info";
}

export function AdminOrderDetailPage() {
  const { orderId } = useParams();
  const order =
    adminOrders.find((item) => item.id === orderId) ?? adminOrders[0];
  const { state, updateAdminOrderStatus } = useCommerce();
  const status = state.adminOrderStatuses[order.id] ?? order.status;
  const [updated, setUpdated] = useState(false);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);

  function updateStatus(nextStatus: AdminOrderStatus) {
    updateAdminOrderStatus(order.id, nextStatus);
    setUpdated(true);
  }

  return (
    <AdminLayout>
      <Button render={<Link to="/admin/pedidos" />} size="sm" variant="ghost">
        <ChevronLeft aria-hidden="true" />
        Pedidos
      </Button>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              Pedido #{order.id}
            </h1>
            <Badge variant={statusVariant(status)}>{status}</Badge>
          </div>
          <p className="mt-2 text-muted-foreground">
            Realizado em {order.placedAt}
          </p>
        </div>
        {status === "EM ABERTO" ? (
          <Button onClick={() => updateStatus("EM PROCESSAMENTO")}>
            Iniciar processamento
          </Button>
        ) : null}
        {status === "EM PROCESSAMENTO" ? (
          <Button onClick={() => updateStatus("PAGAMENTO REALIZADO")}>
            Confirmar pagamento
          </Button>
        ) : null}
        {status === "PAGAMENTO REALIZADO" ? (
          <Button onClick={() => updateStatus("EM TRÂNSITO")}>
            <Truck />
            Enviar pedido
          </Button>
        ) : null}
        {status === "EM TRÂNSITO" ? (
          <Button onClick={() => setConfirmingDelivery(true)}>
            <PackageCheck />
            Confirmar entrega
          </Button>
        ) : null}
      </div>
      {updated ? (
        <div className="mt-6 flex items-center gap-3 rounded-xl bg-success p-4 text-sm text-success-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-200">
          <Check className="size-5" />
          Status atualizado apenas na interface. A transição será registrada
          pela API posteriormente.
        </div>
      ) : null}
      {confirmingDelivery ? (
        <ConfirmDialog
          confirmLabel="Confirmar entrega"
          description="Confirme somente após validar o recebimento. Esta transição será auditada quando a API for integrada."
          onCancel={() => setConfirmingDelivery(false)}
          onConfirm={() => {
            updateStatus("ENTREGUE");
            setConfirmingDelivery(false);
          }}
          title="Confirmar que o pedido foi entregue?"
        />
      ) : null}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Itens do pedido</CardTitle>
              <CardDescription>
                {order.items.length} item(ns) incluído(s) neste pedido.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="pb-3 font-medium">Produto</th>
                    <th className="pb-3 text-right font-medium">Qtd.</th>
                    <th className="pb-3 text-right font-medium">Unitário</th>
                    <th className="pb-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr
                      className="border-b border-border last:border-0"
                      key={item.name}
                    >
                      <td className="py-4 font-medium">{item.name}</td>
                      <td className="py-4 text-right">{item.quantity}</td>
                      <td className="py-4 text-right">{item.unitPrice}</td>
                      <td className="py-4 text-right font-medium">
                        {item.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{order.payment.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span>{order.payment.freight}</span>
              </div>
              {order.payment.coupon ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cupom</span>
                  <span>{order.payment.coupon}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{order.payment.total}</span>
              </div>
              <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                Método de pagamento: {order.payment.card}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fulfilment</CardTitle>
              <CardDescription>
                As transições seguem a ordem autorizada do pedido.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatusTimeline
                currentStatus={status}
                steps={adminOrderStatusSteps}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cliente e entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium">{order.customer.name}</p>
                <p className="mt-1 text-muted-foreground">
                  {order.customer.email}
                  <br />
                  {order.customer.phone}
                </p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  Endereço de entrega
                </p>
                <p className="mt-1 leading-6">{order.deliveryAddress}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
