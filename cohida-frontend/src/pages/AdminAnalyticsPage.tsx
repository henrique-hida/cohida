import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
import { adminAnalyticsData } from "@/mocks";

const colors = ["#61e786", "#5aa7ff", "#f4b740"];

export function AdminAnalyticsPage() {
  const [selected, setSelected] = useState(adminAnalyticsData.categories);
  const [startDate, setStartDate] = useState("2026-06");
  const [endDate, setEndDate] = useState("2026-08");
  const [error, setError] = useState("");
  const selectedSeries = useMemo(
    () =>
      adminAnalyticsData.series.filter((series) =>
        selected.includes(series.category),
      ),
    [selected],
  );
  const chartData = useMemo(
    () =>
      adminAnalyticsData.months.map((month, index) =>
        Object.fromEntries([
          ["month", month],
          ...adminAnalyticsData.series.map((series) => [
            series.category,
            series.values[index],
          ]),
        ]),
      ),
    [],
  );
  function toggle(category: string) {
    setSelected((items) =>
      items.includes(category)
        ? items.filter((item) => item !== category)
        : [...items, category],
    );
  }
  function validateRange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rangeInMonths =
      (Number(endDate.slice(0, 4)) - Number(startDate.slice(0, 4))) * 12 +
      Number(endDate.slice(5)) -
      Number(startDate.slice(5)) +
      1;
    if (!selected.length) {
      setError("Selecione ao menos uma categoria para comparar.");
      return;
    }
    if (startDate > endDate || rangeInMonths < 1 || rangeInMonths > 24) {
      setError("Escolha um período contínuo entre 1 e 24 meses.");
      return;
    }
    setError("");
  }
  function exportReport() {
    const rows = [
      ["Categoria", ...adminAnalyticsData.months],
      ...selectedSeries.map((series) => [
        series.category,
        ...series.values.map((value) =>
          value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        ),
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.map((row) => row.join(";")).join("\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "analise-vendas-cohida.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <AdminLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Análises de vendas
          </h1>
          <p className="mt-2 text-muted-foreground">
            Compare vendas aprovadas por categoria e período.
          </p>
        </div>
        <Button onClick={exportReport}>
          <Download />
          Exportar planilha
        </Button>
      </div>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Filtros do relatório</CardTitle>
          <CardDescription>
            Selecione um período entre 1 e 24 meses e uma ou mais categorias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap items-end gap-4"
            onSubmit={validateRange}
          >
            <label className="space-y-2">
              <span className="text-sm font-medium">Início</span>
              <input
                className="block h-10 rounded-lg border border-input bg-background px-3 text-sm"
                value={startDate}
                max="2026-08"
                min="2024-09"
                onChange={(event) => setStartDate(event.target.value)}
                type="month"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Fim</span>
              <input
                className="block h-10 rounded-lg border border-input bg-background px-3 text-sm"
                value={endDate}
                max="2026-08"
                min="2024-09"
                onChange={(event) => setEndDate(event.target.value)}
                type="month"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {adminAnalyticsData.categories.map((category) => (
                <label className="cursor-pointer" key={category}>
                  <input
                    checked={selected.includes(category)}
                    className="sr-only"
                    onChange={() => toggle(category)}
                    type="checkbox"
                  />
                  <Badge
                    className={selected.includes(category) ? "" : "opacity-45"}
                    variant="outline"
                  >
                    {category}
                  </Badge>
                </label>
              ))}
            </div>
            <Button type="submit" variant="outline">
              Aplicar
            </Button>
          </form>
          {error ? (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          ) : null}
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Vendas por categoria</CardTitle>
          <CardDescription>
            Passe o cursor pelos pontos para ver o valor exato em BRL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart
                data={chartData}
                margin={{ top: 16, right: 24, bottom: 8, left: 12 }}
              >
                <CartesianGrid
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickFormatter={(value) =>
                    `R$ ${Number(value / 1000).toFixed(0)}k`
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                  }}
                  formatter={(value) =>
                    Number(value ?? 0).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  }
                />
                <Legend />
                {selectedSeries.map((series, index) => (
                  <Line
                    activeDot={{ r: 6 }}
                    dataKey={series.category}
                    dot={{ r: 4 }}
                    key={series.category}
                    stroke={colors[index]}
                    strokeWidth={3}
                    type="monotone"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
