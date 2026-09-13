import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminAnalyticsData } from "@/mocks";

const colors = ["#61e786", "#5aa7ff", "#f4b740"];
const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--popover-foreground)",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    new Date(`${value}T12:00:00`),
  );
}

function toDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isMonthInRange(month: string, startDate: string, endDate: string) {
  const monthStart = toDate(month);
  const monthEnd = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0,
  );

  return monthStart <= toDate(endDate) && monthEnd >= toDate(startDate);
}

export function AdminAnalyticsPage() {
  const [selected, setSelected] = useState(adminAnalyticsData.categories);
  const [startDate, setStartDate] = useState("2026-06-01");
  const [endDate, setEndDate] = useState("2026-08-31");
  const [appliedRange, setAppliedRange] = useState({
    startDate: "2026-06-01",
    endDate: "2026-08-31",
  });
  const [error, setError] = useState("");
  const visibleMonths = useMemo(
    () =>
      adminAnalyticsData.months.filter((month) =>
        isMonthInRange(
          month.date,
          appliedRange.startDate,
          appliedRange.endDate,
        ),
      ),
    [appliedRange],
  );
  const selectedSeries = useMemo(
    () =>
      adminAnalyticsData.series.filter((series) =>
        selected.includes(series.category),
      ),
    [selected],
  );
  const chartData = useMemo(
    () =>
      visibleMonths.map((month) => {
        const index = adminAnalyticsData.months.indexOf(month);

        return Object.fromEntries([
          ["month", month.label],
          ...adminAnalyticsData.series.map((series) => [
            series.category,
            series.values[index],
          ]),
        ]);
      }),
    [visibleMonths],
  );
  const categoryDistribution = useMemo(
    () =>
      selectedSeries.map((series) => ({
        name: series.category,
        value: visibleMonths.reduce(
          (total, month) =>
            total + series.values[adminAnalyticsData.months.indexOf(month)],
          0,
        ),
      })),
    [selectedSeries, visibleMonths],
  );
  const topProducts = useMemo(
    () =>
      adminAnalyticsData.topProducts
        .map((product) => ({
          ...product,
          units: visibleMonths.reduce(
            (total, month) =>
              total +
              product.monthlyUnits[adminAnalyticsData.months.indexOf(month)],
            0,
          ),
        }))
        .sort((first, second) => second.units - first.units),
    [visibleMonths],
  );
  function validateRange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rangeInMonths =
      (Number(endDate.slice(0, 4)) - Number(startDate.slice(0, 4))) * 12 +
      Number(endDate.slice(5, 7)) -
      Number(startDate.slice(5, 7)) +
      1;
    if (!selected.length) {
      setError("Selecione ao menos uma categoria para comparar.");
      return;
    }
    if (startDate > endDate || rangeInMonths < 1 || rangeInMonths > 24) {
      setError("Escolha um período contínuo entre 1 e 24 meses.");
      return;
    }
    setAppliedRange({ startDate, endDate });
    setError("");
  }
  function exportReport() {
    const rows = [
      ["Categoria", ...visibleMonths.map((month) => month.label)],
      ...selectedSeries.map((series) => [
        series.category,
        ...visibleMonths
          .map(
            (month) => series.values[adminAnalyticsData.months.indexOf(month)],
          )
          .map((value) =>
            value.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }),
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
            <div className="flex flex-col items-start gap-2">
              <span className="text-sm font-medium">Início</span>
              <div>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        className="min-w-44 justify-start"
                        variant="outline"
                      />
                    }
                  >
                    {formatDate(startDate)}
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      disabled={{
                        after: toDate(endDate),
                        before: new Date("2024-09-01"),
                      }}
                      mode="single"
                      onSelect={(date) => date && setStartDate(toIsoDate(date))}
                      selected={toDate(startDate)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2">
              <span className="text-sm font-medium">Fim</span>
              <div>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        className="min-w-44 justify-start"
                        variant="outline"
                      />
                    }
                  >
                    {formatDate(endDate)}
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      disabled={{
                        after: new Date("2026-08-31"),
                        before: toDate(startDate),
                      }}
                      mode="single"
                      onSelect={(date) => date && setEndDate(toIsoDate(date))}
                      selected={toDate(endDate)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2">
              <span className="text-sm font-medium">Categorias</span>
              <div>
                <Select
                  multiple
                  onValueChange={(value) => setSelected(value)}
                  value={selected}
                >
                  <SelectTrigger className="min-w-52">
                    <SelectValue>
                      {(values: string[]) =>
                        values.length
                          ? `${values.length} categorias selecionadas`
                          : "Selecione categorias"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {adminAnalyticsData.categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2">
              <span
                aria-hidden="true"
                className="text-sm font-medium opacity-0"
              >
                Ação
              </span>
              <Button type="submit" variant="outline">
                Aplicar
              </Button>
            </div>
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
                  contentStyle={tooltipStyle}
                  formatter={(value) =>
                    Number(value ?? 0).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  }
                  itemStyle={{ color: "var(--popover-foreground)" }}
                  labelStyle={{ color: "var(--popover-foreground)" }}
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
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produtos mais vendidos</CardTitle>
            <CardDescription>
              Quantidade de itens aprovados no período.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{ left: 20, right: 24 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                  />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    type="category"
                    width={88}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => `${value} un.`}
                    itemStyle={{ color: "var(--popover-foreground)" }}
                    labelStyle={{ color: "var(--popover-foreground)" }}
                  />
                  <Bar
                    dataKey="units"
                    fill="#61e786"
                    name="Unidades"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Participação por categoria</CardTitle>
            <CardDescription>
              Distribuição da receita entre as categorias selecionadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    dataKey="value"
                    innerRadius={56}
                    nameKey="name"
                    outerRadius={94}
                    paddingAngle={3}
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell
                        fill={colors[index % colors.length]}
                        key={entry.name}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) =>
                      Number(value ?? 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })
                    }
                    itemStyle={{ color: "var(--popover-foreground)" }}
                    labelStyle={{ color: "var(--popover-foreground)" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
