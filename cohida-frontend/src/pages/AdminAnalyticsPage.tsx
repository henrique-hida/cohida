import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminDataState } from "@/components/admin/AdminDataState";
import { AdminCategoryMultiSelect } from "@/components/admin/AdminCategoryMultiSelect";
import { AdminListFiltersCard } from "@/components/admin/AdminListFiltersCard";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
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
import { useCategories } from "@/data/useCategories";
import {
  commerceApi,
  type ApiAnalyticsOverview,
  type ApiSalesPoint,
  type ApiTopProduct,
} from "@/lib/commerceApi";
import { formatCurrency } from "@/lib/currency";

const productPageSize = 10;

function formatMonth(period: string) {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  }).format(new Date(year, month - 1, 1));
}

export function AdminAnalyticsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const availableCategories = useCategories();
  const [overview, setOverview] = useState<ApiAnalyticsOverview | null>(null);
  const [sales, setSales] = useState<ApiSalesPoint[]>([]);
  const [topProducts, setTopProducts] = useState<ApiTopProduct[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextOverview, nextSales, nextTopProducts] = await Promise.all([
        commerceApi.analyticsOverview(
          from || undefined,
          to || undefined,
          selectedCategories,
        ),
        commerceApi.analyticsSales(
          from || undefined,
          to || undefined,
          selectedCategories,
        ),
        commerceApi.analyticsTopProducts(
          from || undefined,
          to || undefined,
          selectedCategories,
        ),
      ]);
      setOverview(nextOverview);
      setSales(nextSales);
      setTopProducts(nextTopProducts);
      setHasLoaded(true);
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível carregar as análises.",
      );
    } finally {
      setLoading(false);
    }
  }, [from, selectedCategories, to]);

  const filteredTopProducts = useMemo(() => {
    const term = productSearch.trim().toLocaleLowerCase("pt-BR");
    return topProducts.filter((product) =>
      `${product.productName} ${product.sku}`
        .toLocaleLowerCase("pt-BR")
        .includes(term),
    );
  }, [productSearch, topProducts]);
  const productTotalPages = Math.max(
    1,
    Math.ceil(filteredTopProducts.length / productPageSize),
  );
  const safeProductPage = Math.min(productPage, productTotalPages);
  const visibleTopProducts = filteredTopProducts.slice(
    (safeProductPage - 1) * productPageSize,
    safeProductPage * productPageSize,
  );
  const salesSeries = useMemo(() => {
    const categoryIds = selectedCategories.length ? selectedCategories : [null];
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
      const series = categorySeries.get(point.category);
      if (series) {
        row[series.dataKey] =
          Number(row[series.dataKey] ?? 0) + point.revenueCents;
      }
    });

    return [...rows.values()].sort((first, second) =>
      String(first.period).localeCompare(String(second.period)),
    );
  }, [sales, salesSeries]);
  const selectedPeriod: DateRange | undefined =
    from || to
      ? {
          from: from ? parseISO(from) : undefined,
          to: to ? parseISO(to) : undefined,
        }
      : undefined;

  function handlePeriodChange(range: DateRange | undefined) {
    setFrom(range?.from ? format(range.from, "yyyy-MM-dd") : "");
    setTo(range?.to ? format(range.to, "yyyy-MM-dd") : "");
    setProductPage(1);
  }

  const periodLabel = selectedPeriod?.from
    ? `${format(selectedPeriod.from, "dd/MM/yyyy")}${selectedPeriod.to ? ` – ${format(selectedPeriod.to, "dd/MM/yyyy")}` : " – …"}`
    : selectedPeriod?.to
      ? `… – ${format(selectedPeriod.to, "dd/MM/yyyy")}`
      : "Período";

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <AdminPageLayout
      description="Acompanhe a evolução das vendas e os produtos com melhor desempenho no período."
      title="Análises de vendas"
    >
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
          <Card key={label as string}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>
      <AdminListFiltersCard>
        <div className="flex flex-wrap items-center justify-start gap-2">
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    aria-label="Selecionar período de análise"
                    className="h-10 min-w-52 justify-start text-left font-normal"
                    variant="outline"
                  />
                }
              >
                <CalendarDays
                  aria-hidden="true"
                  className="text-muted-foreground"
                />
                <span className={selectedPeriod ? "" : "text-muted-foreground"}>
                  {periodLabel}
                </span>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  defaultMonth={selectedPeriod?.from}
                  mode="range"
                  numberOfMonths={1}
                  onSelect={handlePeriodChange}
                  selected={selectedPeriod}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            {selectedPeriod ? (
              <Button
                aria-label="Limpar período"
                onClick={() => handlePeriodChange(undefined)}
                size="icon-sm"
                title="Limpar período"
                variant="ghost"
              >
                <X aria-hidden="true" className="text-muted-foreground" />
              </Button>
            ) : null}
          </div>
          <AdminCategoryMultiSelect
            categories={availableCategories}
            onValueChange={(values) => {
              setSelectedCategories(values);
              setProductPage(1);
            }}
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
      {loading && !hasLoaded ? (
        <AdminDataState
          description="Calculando os indicadores do período selecionado."
          title="Carregando análises"
          variant="loading"
        />
      ) : (
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
          <section className="mt-8">
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
                    <Bar
                      dataKey="quantity"
                      name="Unidades"
                      radius={[6, 6, 0, 0]}
                    >
                      {topProducts.map((product, index) => (
                        <Cell
                          key={product.sku}
                          fill={`var(--chart-${(index % 5) + 1})`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>
          <div className="mt-8 grid gap-4">
            <AdminListFiltersCard>
              <AdminListToolbar
                onSearchChange={(value) => {
                  setProductSearch(value);
                  setProductPage(1);
                }}
                searchLabel="Pesquisar produtos mais vendidos"
                searchPlaceholder="Nome do produto ou SKU"
                searchValue={productSearch}
              />
            </AdminListFiltersCard>
            <Card>
              <CardContent>
                {visibleTopProducts.length ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[36rem] text-left text-sm">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground">
                            <th className="pb-3">Produto</th>
                            <th className="pb-3">SKU</th>
                            <th className="pb-3 text-right">Unidades</th>
                            <th className="pb-3 text-right">Faturamento</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleTopProducts.map((product) => (
                            <tr
                              className="border-b border-border last:border-0"
                              key={product.sku}
                            >
                              <td className="py-3">{product.productName}</td>
                              <td className="py-3">{product.sku}</td>
                              <td className="py-3 text-right">
                                {product.quantity}
                              </td>
                              <td className="py-3 text-right">
                                {formatCurrency(product.revenueCents)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <AdminPagination
                      currentPage={safeProductPage}
                      onPageChange={setProductPage}
                      pageSize={productPageSize}
                      totalItems={filteredTopProducts.length}
                    />
                  </>
                ) : (
                  <AdminDataState
                    description={
                      productSearch
                        ? "A busca não encontrou produtos."
                        : "Não há vendas registradas para os filtros selecionados."
                    }
                    title={
                      productSearch
                        ? "Nenhum resultado encontrado"
                        : "Sem dados no período"
                    }
                    variant="empty"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AdminPageLayout>
  );
}
