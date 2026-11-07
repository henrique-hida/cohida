import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminDataState } from "@/components/admin/AdminDataState";
import { AdminCategoryMultiSelect } from "@/components/admin/AdminCategoryMultiSelect";
import { AdminListFiltersCard } from "@/components/admin/AdminListFiltersCard";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCategories } from "@/data/useCategories";
import { commerceApi, type ApiSalesPoint } from "@/lib/commerceApi";
import { formatCurrency } from "@/lib/currency";

function formatMonth(period: string) {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  }).format(new Date(year, month - 1, 1));
}

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            aria-label={`Selecionar data de ${label.toLowerCase()}`}
            className="h-10 justify-start text-left font-normal"
            variant="outline"
          />
        }
      >
        <CalendarDays aria-hidden="true" className="text-muted-foreground" />
        <span>
          {label}: {selected ? format(selected, "dd/MM/yyyy") : "Selecionar"}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          defaultMonth={selected}
          locale={ptBR}
          mode="single"
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
          selected={selected}
        />
      </PopoverContent>
    </Popover>
  );
}

export function AdminAnalyticsPage() {
  const [from, setFrom] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(() => `${new Date().getFullYear()}-12-31`);
  const [categoryFilter, setCategoryFilter] = useState<string[] | null>(null);
  const availableCategories = useCategories();
  const selectedCategories = useMemo(
    () => categoryFilter ?? availableCategories.map((category) => category.id),
    [availableCategories, categoryFilter],
  );
  const [sales, setSales] = useState<ApiSalesPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      if (!from || !to || !selectedCategories.length) {
        setSales([]);
        setError("");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const result = await commerceApi.analyticsSales(
          from,
          to,
          selectedCategories,
        );
        if (active) setSales(result);
      } catch (reason) {
        if (active) {
          setSales([]);
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar as vendas.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [from, to, selectedCategories]);

  const salesSeries = useMemo(() => {
    const categoryIds = selectedCategories;
    return categoryIds.map((categoryId, index) => ({
      categoryId,
      color: `var(--chart-${(index % 5) + 1})`,
      dataKey: `revenue_${index}`,
      name: categoryId
        ? (availableCategories.find((category) => category.id === categoryId)
            ?.name ?? categoryId)
        : "Faturamento",
    }));
  }, [availableCategories, selectedCategories]);
  const salesChartData = useMemo(() => {
    const categorySeries = new Map(
      salesSeries.map((series) => [series.categoryId, series]),
    );
    const rows = new Map<string, Record<string, string | number>>();

    sales.forEach((point) => {
      let row = rows.get(point.period);
      if (!row) {
        row = { period: point.period };
        salesSeries.forEach((series) => {
          row![series.dataKey] = 0;
        });
        rows.set(point.period, row);
      }
      const series = point.category
        ? categorySeries.get(point.category)
        : undefined;
      if (series) {
        row[series.dataKey] =
          Number(row[series.dataKey] ?? 0) + point.revenueCents;
      }
    });

    return [...rows.values()].sort((first, second) =>
      String(first.period).localeCompare(String(second.period)),
    );
  }, [sales, salesSeries]);
  return (
    <AdminPageLayout
      description="Compare a evolução das vendas entregues por categoria."
      title="Análises de vendas"
    >
      <AdminListFiltersCard className="mt-8">
        <div className="flex flex-wrap items-center justify-start gap-2">
          <DateFilter label="Início" onChange={setFrom} value={from} />
          <DateFilter label="Fim" onChange={setTo} value={to} />
          <AdminCategoryMultiSelect
            categories={availableCategories}
            onValueChange={setCategoryFilter}
            values={selectedCategories}
          />
        </div>
      </AdminListFiltersCard>
      {error ? (
        <p
          className="mt-6 rounded-lg bg-error p-3 text-sm text-error-foreground"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {loading ? (
        <AdminDataState
          description="Consultando as vendas do período selecionado."
          title="Carregando análises"
          variant="loading"
        />
      ) : !from || !to ? (
        <AdminDataState
          description="Selecione as datas de início e fim."
          title="Selecione um período"
          variant="empty"
        />
      ) : selectedCategories.length === 0 ? (
        <AdminDataState
          description="Selecione uma ou mais categorias para comparar."
          title="Selecione categorias"
          variant="empty"
        />
      ) : !error ? (
        <>
          <section className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Faturamento por período</CardTitle>
              </CardHeader>
              <CardContent className="h-[26rem]">
                <ResponsiveContainer>
                  <AreaChart
                    data={salesChartData}
                    margin={{ left: 8, right: 12 }}
                  >
                    <defs>
                      {salesSeries.map((series, index) => (
                        <linearGradient
                          id={`sales-gradient-${index}`}
                          key={series.dataKey}
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={series.color}
                            stopOpacity={0.34}
                          />
                          <stop
                            offset="95%"
                            stopColor={series.color}
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid
                      stroke="var(--border)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      axisLine={false}
                      dataKey="period"
                      tickFormatter={formatMonth}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickFormatter={(value) => formatCurrency(Number(value))}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    />
                    <Legend verticalAlign="bottom" height={32} />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        borderRadius: "var(--radius-lg)",
                        borderColor: "var(--border)",
                        backgroundColor: "var(--popover)",
                      }}
                    />
                    {salesSeries.map((series, index) => (
                      <Area
                        activeDot={{
                          r: 5,
                          fill: series.color,
                          stroke: "var(--background)",
                          strokeWidth: 2,
                        }}
                        dataKey={series.dataKey}
                        fill={`url(#sales-gradient-${index})`}
                        key={series.dataKey}
                        name={series.name}
                        stroke={series.color}
                        strokeWidth={3}
                        type="monotone"
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}
    </AdminPageLayout>
  );
}
