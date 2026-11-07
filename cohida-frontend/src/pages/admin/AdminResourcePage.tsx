import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { AdminDataState } from "@/components/admin/AdminDataState";
import { AdminFilterSelect } from "@/components/admin/AdminFilterSelect";
import { AdminListFiltersCard } from "@/components/admin/AdminListFiltersCard";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { commerceApi, type ApiOrder, type ApiReturn } from "@/lib/commerceApi";
import { commerceStatus } from "@/lib/commerceStatus";
import { formatCurrency } from "@/lib/currency";
import { AdminProductsPage } from "@/pages/admin/AdminProductsPage";

type SalesResource = "pedidos" | "trocas";

interface SalesRow {
  detail: string;
  href: string;
  id: number;
  searchText: string;
  status: string;
}

const pageSize = 10;

export function AdminResourcePage({
  resource,
}: {
  resource: "produtos" | SalesResource;
}) {
  if (resource === "produtos") return <AdminProductsPage />;
  return <AdminSalesResourcePage key={resource} resource={resource} />;
}

function AdminSalesResourcePage({ resource }: { resource: SalesResource }) {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [returns, setReturns] = useState<ApiReturn[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (resource === "pedidos") {
        setOrders(await commerceApi.adminOrders());
      } else {
        setReturns(await commerceApi.adminReturns());
      }
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível carregar os dados.",
      );
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const rows = useMemo<SalesRow[]>(
    () =>
      resource === "pedidos"
        ? orders.map((order) => ({
            detail: `${order.customerName} · ${formatCurrency(order.totalCents)}`,
            href: `/admin/pedidos/${order.id}`,
            id: order.id,
            searchText: `${order.id} ${order.customerName} ${order.status}`,
            status: order.status,
          }))
        : returns.map((request) => ({
            detail: `Pedido #${request.orderId} · ${request.reason}`,
            href: `/admin/trocas/${request.id}`,
            id: request.id,
            searchText: `${request.id} ${request.orderId} ${request.reason} ${request.trackingCode ?? ""} ${request.status}`,
            status: request.status,
          })),
    [orders, resource, returns],
  );
  const statuses = useMemo(
    () =>
      resource === "trocas"
        ? ["EM_TROCA", "TROCA_AUTORIZADA", "TROCA_NEGADA", "TROCADO"]
        : [...new Set(rows.map((row) => row.status))].sort(),
    [resource, rows],
  );
  const filteredRows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return rows.filter(
      (row) =>
        (!statusFilter || row.status === statusFilter) &&
        (!term || row.searchText.toLocaleLowerCase("pt-BR").includes(term)),
    );
  }, [rows, search, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
  const title = resource === "pedidos" ? "Pedidos" : "Trocas";

  return (
    <AdminPageLayout
      description={
        resource === "pedidos"
          ? "Acompanhe pedidos, pagamentos e entregas."
          : "Acompanhe solicitações e autorizações de troca."
      }
      title={title}
    >
      <div className="mt-8 grid gap-4">
        <AdminListFiltersCard>
          <AdminListToolbar
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchLabel={`Pesquisar em ${title.toLocaleLowerCase("pt-BR")}`}
            searchPlaceholder={
              resource === "pedidos"
                ? "Número ou nome do cliente"
                : "Pedido, produto, motivo ou rastreio"
            }
            searchValue={search}
          >
            <AdminFilterSelect
              ariaLabel={`Filtrar ${title.toLocaleLowerCase("pt-BR")} por status`}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              options={[
                ...statuses.map((status) => ({
                  label: commerceStatus(status).label,
                  value: status,
                })),
              ]}
              placeholder="Status"
              value={statusFilter}
            />
          </AdminListToolbar>
        </AdminListFiltersCard>
        <Card>
          <CardContent>
            {loading ? (
              <AdminDataState
                description="Consultando os registros cadastrados."
                title={`Carregando ${title.toLocaleLowerCase("pt-BR")}`}
                variant="loading"
              />
            ) : error ? (
              <AdminDataState
                action={
                  <Button
                    onClick={() => void load()}
                    type="button"
                    variant="outline"
                  >
                    Tentar novamente
                  </Button>
                }
                description={error}
                title={`Não foi possível carregar ${title.toLocaleLowerCase("pt-BR")}`}
                variant="error"
              />
            ) : visibleRows.length ? (
              <>
                <div className="divide-y divide-border">
                  {visibleRows.map((row) => (
                    <Link
                      className="flex flex-col gap-2 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:px-2"
                      key={row.id}
                      to={row.href}
                    >
                      <span className="min-w-0 font-medium">
                        #{row.id} · {row.detail}
                      </span>
                      <Badge
                        className="w-fit"
                        variant={commerceStatus(row.status).variant}
                      >
                        {commerceStatus(row.status).label}
                      </Badge>
                    </Link>
                  ))}
                </div>
                <AdminPagination
                  currentPage={safePage}
                  onPageChange={setPage}
                  pageSize={pageSize}
                  totalItems={filteredRows.length}
                />
              </>
            ) : (
              <AdminDataState
                description="Ajuste a busca ou os filtros e tente novamente."
                title="Nenhum resultado encontrado"
                variant="empty"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
