import { useState } from "react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { useCommerce } from "@/data/useCommerce";

export function AdminCouponsPage() {
  const { createCoupon, state, toggleCoupon } = useCommerce();
  const [error, setError] = useState("");

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Cupons</h1>
        <p className="mt-2 text-muted-foreground">
          Crie cupons promocionais e de troca para a demonstração.
        </p>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Novo cupom</CardTitle>
            <CardDescription>
              Um cupom promocional pode ser usado por pedido; cupons de troca
              acumulam conforme o saldo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                try {
                  createCoupon({
                    code: String(form.get("code") ?? ""),
                    kind: String(form.get("kind")) as
                      "exchange" | "promotional",
                    valueCents: Math.round(
                      Number(form.get("value") ?? 0) * 100,
                    ),
                  });
                  event.currentTarget.reset();
                  setError("");
                } catch (reason) {
                  setError(
                    reason instanceof Error
                      ? reason.message
                      : "Não foi possível criar o cupom.",
                  );
                }
              }}
            >
              <label className="grid gap-2 text-sm font-medium">
                Código
                <input
                  className="h-10 rounded-lg border border-input bg-background px-3"
                  name="code"
                  placeholder="EX.: BEMVINDO10"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Tipo
                <select
                  className="h-10 rounded-lg border border-input bg-background px-3"
                  defaultValue="promotional"
                  name="kind"
                >
                  <option value="promotional">Promocional</option>
                  <option value="exchange">Troca</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Valor (R$)
                <input
                  className="h-10 rounded-lg border border-input bg-background px-3"
                  min="0.01"
                  name="value"
                  required
                  step="0.01"
                  type="number"
                />
              </label>
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
              <Button type="submit">Criar cupom</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cupons cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="pb-3">Código</th>
                  <th className="pb-3">Tipo</th>
                  <th className="pb-3">Valor</th>
                  <th className="pb-3">Situação</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {state.coupons.map((coupon) => (
                  <tr className="border-b border-border" key={coupon.id}>
                    <td className="py-4 font-medium">{coupon.code}</td>
                    <td className="py-4">
                      {coupon.kind === "exchange" ? "Troca" : "Promocional"}
                    </td>
                    <td className="py-4">
                      {formatCurrency(coupon.valueCents)}
                    </td>
                    <td className="py-4">
                      {coupon.active ? "Ativo" : "Inativo"}
                    </td>
                    <td className="py-4 text-right">
                      <Button
                        onClick={() => toggleCoupon(coupon.id)}
                        size="sm"
                        variant="outline"
                      >
                        {coupon.active ? "Inativar" : "Ativar"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
