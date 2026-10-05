import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { useCategories } from "@/data/useCategories";
import {
  commerceApi,
  type ApiAnalyticsOverview,
  type ApiSalesPoint,
  type ApiTopProduct,
} from "@/lib/commerceApi";

function formatMonth(period: string) {
  const [year, month] = period.split("-").map(Number);

  if (!year || !month) return period;

  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(
    new Date(year, month - 1, 1),
  );
}

export function AdminAnalyticsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState("");
  const categories = useCategories();
  const [overview, setOverview] = useState<ApiAnalyticsOverview | null>(null);
  const [sales, setSales] = useState<ApiSalesPoint[]>([]);
  const [topProducts, setTopProducts] = useState<ApiTopProduct[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [nextOverview, nextSales, nextTopProducts] = await Promise.all([
        commerceApi.analyticsOverview(from || undefined, to || undefined, category || undefined),
        commerceApi.analyticsSales(from || undefined, to || undefined, category || undefined),
        commerceApi.analyticsTopProducts(from || undefined, to || undefined, category || undefined),
      ]);
      setOverview(nextOverview);
      setSales(nextSales);
      setTopProducts(nextTopProducts);
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível carregar as análises.",
      );
    }
  }, [category, from, to]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Análises de vendas
          </h1>
          <p className="mt-2 text-muted-foreground">
            Dados reais dos pedidos persistidos no backend.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-sm">
            Início
            <input
              className="h-9 rounded-lg border border-input bg-background px-3"
              onChange={(event) => setFrom(event.target.value)}
              type="date"
              value={from}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Fim
            <input
              className="h-9 rounded-lg border border-input bg-background px-3"
              onChange={(event) => setTo(event.target.value)}
              type="date"
              value={to}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Categoria
            <select
              className="h-9 rounded-lg border border-input bg-background px-3"
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              <option value="">Todas</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {error ? (
        <p className="mt-6 rounded-lg bg-error p-3 text-sm text-error-foreground">
          {error}
        </p>
      ) : null}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Faturamento",
            overview ? formatCurrency(overview.revenueCents) : "—",
          ],
          ["Pedidos", overview?.orders ?? "—"],
          [
            "Ticket médio",
            overview ? formatCurrency(overview.averageTicketCents) : "—",
          ],
          ["Devoluções", overview?.returns ?? "—"],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>
      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Faturamento por período</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer>
              <LineChart data={sales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tickFormatter={formatMonth} />
                <YAxis tickFormatter={(value) => `R$ ${value / 100}`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line
                  dataKey="revenueCents"
                  name="Faturamento"
                  stroke="#61e786"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Itens mais vendidos</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="productName" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" name="Unidades" fill="#5aa7ff" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Produtos mais vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-3">Produto</th>
                  <th className="pb-3">SKU</th>
                  <th className="pb-3 text-right">Unidades</th>
                  <th className="pb-3 text-right">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr className="border-b border-border" key={product.sku}>
                    <td className="py-3">{product.productName}</td>
                    <td className="py-3">{product.sku}</td>
                    <td className="py-3 text-right">{product.quantity}</td>
                    <td className="py-3 text-right">
                      {formatCurrency(product.revenueCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
