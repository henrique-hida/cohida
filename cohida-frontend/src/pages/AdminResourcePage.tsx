import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminDataState } from "@/components/admin/AdminDataState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { AdminProductsPage } from "@/pages/AdminProductsPage";
import {
  adminCustomers,
  adminExchanges,
  adminOrders,
  adminResourceContent,
  type AdminResource,
} from "@/mocks";

export function AdminResourcePage({ resource }: { resource: AdminResource }) {
  if (resource === "produtos") return <AdminProductsPage />;

  return <AdminMockResourcePage resource={resource} />;
}

function AdminMockResourcePage({
  resource,
}: {
  resource: Exclude<AdminResource, "produtos">;
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionNotice, setActionNotice] = useState("");
  const page = adminResourceContent[resource];
  const isExport = page.action.startsWith("Exportar");
  const actionLink =
    resource === "estoque"
      ? "/admin/estoque/entrada"
      : resource === "clientes"
        ? "/admin/clientes/novo"
        : undefined;
  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    return page.rows
      .map((row, index) => ({ index, row }))
      .filter(
        ({ row }) =>
          !normalizedSearch ||
          row.some((cell) =>
            cell.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
          ),
      )
      .filter(
        ({ row }) => statusFilter === "todos" || row.at(-1) === statusFilter,
      )
      .sort(({ row: first }, { row: second }) => {
        const result = first[0].localeCompare(second[0], "pt-BR");
        return sortDirection === "asc" ? result : -result;
      });
  }, [page.rows, resource, search, sortDirection, statusFilter]);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleRows = filteredRows.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
  const statuses = [...new Set(page.rows.map((row) => row.at(-1) ?? ""))];

  function updateSearch(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  function runPrimaryAction() {
    if (resource === "trocas") {
      setStatusFilter("EM TROCA");
      setCurrentPage(1);
      setActionNotice("Exibindo solicitações de troca que aguardam ação.");
      return;
    }
    if (resource === "pedidos") {
      const report = [page.columns, ...filteredRows.map(({ row }) => row)]
        .map((row) => row.join(";"))
        .join("\n");
      const url = URL.createObjectURL(
        new Blob([report], { type: "text/csv;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.download = "pedidos-cohida.csv";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      setActionNotice("Planilha de pedidos exportada com os filtros atuais.");
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {page.heading}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {page.description}
          </p>
        </div>
        <div className="flex gap-2">
          {resource === "estoque" ? (
            <Button
              render={<Link to="/admin/estoque/movimentacoes" />}
              variant="outline"
            >
              Movimentações
            </Button>
          ) : null}
          <Button
            onClick={actionLink ? undefined : runPrimaryAction}
            render={actionLink ? <Link to={actionLink} /> : undefined}
          >
            {isExport ? (
              <Download />
            ) : resource === "trocas" ? (
              <SlidersHorizontal />
            ) : (
              <Plus />
            )}
            {page.action}
          </Button>
        </div>
      </div>
      <Card className="mt-8">
        <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Lista operacional</CardTitle>
            <CardDescription>
              Dados demonstrativos até a integração com a API.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <label className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                aria-label={`Pesquisar em ${page.heading}`}
                className="h-9 w-60 rounded-lg border border-input bg-background pl-9 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Pesquisar"
                value={search}
              />
            </label>
            <Button
              aria-label="Alternar ordem alfabética"
              onClick={() =>
                setSortDirection((direction) =>
                  direction === "asc" ? "desc" : "asc",
                )
              }
              size="icon-lg"
              variant="outline"
            >
              <ArrowDownUp />
            </Button>
            <label className="sr-only" htmlFor={`status-${resource}`}>
              Filtrar por status
            </label>
            <select
              className="h-9 max-w-36 rounded-lg border border-input bg-background px-2 text-sm"
              id={`status-${resource}`}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
              value={statusFilter}
            >
              <option value="todos">Todos</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {actionNotice ? (
            <p className="mb-4 rounded-lg bg-success p-3 text-sm text-success-foreground">
              {actionNotice}
            </p>
          ) : null}
          <div className="hidden md:block">
            <Table className="table-fixed text-left">
              <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  {page.columns.map((column) => (
                    <th className="pb-3 font-medium" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.length ? (
                  visibleRows.map(({ index: rowIndex, row }) => {
                    const cells = row.slice(0, page.columns.length);
                    const detailPath =
                      resource === "pedidos"
                        ? `/admin/pedidos/${adminOrders[rowIndex]?.id ?? adminOrders[0].id}`
                        : resource === "trocas"
                          ? `/admin/trocas/${adminExchanges[rowIndex]?.id ?? adminExchanges[0].id}`
                          : resource === "clientes"
                            ? `/admin/clientes/${adminCustomers[rowIndex]?.id ?? adminCustomers[0].id}`
                            : undefined;
                    return (
                      <tr
                        aria-label={detailPath ? `Abrir ${row[0]}` : undefined}
                        className={`border-b border-border last:border-0 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200 ${detailPath ? "cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50" : ""}`}
                        key={row[0]}
                        onClick={
                          detailPath ? () => navigate(detailPath) : undefined
                        }
                        onKeyDown={
                          detailPath
                            ? (event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  navigate(detailPath);
                                }
                              }
                            : undefined
                        }
                        role={detailPath ? "link" : undefined}
                        tabIndex={detailPath ? 0 : undefined}
                      >
                        {cells.map((cell, index) => (
                          <td className="py-4" key={cell}>
                            {index === cells.length - 1 ? (
                              <Badge
                                variant={
                                  cell.includes("BAIXO") ||
                                  cell.includes("PROCESSAMENTO") ||
                                  cell.includes("TROCA")
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {cell}
                              </Badge>
                            ) : index === 0 ? (
                              <span className="font-medium">{cell}</span>
                            ) : (
                              cell
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="p-0" colSpan={page.columns.length}>
                      <AdminDataState
                        description={`Não encontramos registros para “${search || "os filtros selecionados"}”.`}
                        title="Nenhum resultado encontrado"
                        variant="empty"
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
          <div className="space-y-3 md:hidden">
            {visibleRows.length ? (
              visibleRows.map(({ index: rowIndex, row }) => {
                const cells = row.slice(0, page.columns.length);
                const detailPath =
                  resource === "pedidos"
                    ? `/admin/pedidos/${adminOrders[rowIndex]?.id ?? adminOrders[0].id}`
                    : resource === "trocas"
                      ? `/admin/trocas/${adminExchanges[rowIndex]?.id ?? adminExchanges[0].id}`
                      : resource === "clientes"
                        ? `/admin/clientes/${adminCustomers[rowIndex]?.id ?? adminCustomers[0].id}`
                        : undefined;
                const cardContent = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium">{cells[0]}</span>
                      <Badge variant="outline">{cells.at(-1)}</Badge>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {cells.slice(1, -1).map((cell, index) => (
                        <div key={`${row[0]}-${cell}`}>
                          <dt className="text-xs text-muted-foreground">
                            {page.columns[index + 1]}
                          </dt>
                          <dd>{cell}</dd>
                        </div>
                      ))}
                    </dl>
                  </>
                );
                return detailPath ? (
                  <Link
                    className="block rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
                    key={row[0]}
                    to={detailPath}
                  >
                    {cardContent}
                  </Link>
                ) : (
                  <div
                    className="rounded-xl border border-border p-4"
                    key={row[0]}
                  >
                    {cardContent}
                  </div>
                );
              })
            ) : (
              <AdminDataState
                description={`Não encontramos registros para “${search || "os filtros selecionados"}”.`}
                title="Nenhum resultado encontrado"
                variant="empty"
              />
            )}
          </div>
          {filteredRows.length ? (
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
              <span>
                {(safePage - 1) * pageSize + 1}–
                {Math.min(safePage * pageSize, filteredRows.length)} de{" "}
                {filteredRows.length}
              </span>
              <div className="flex gap-2">
                <Button
                  aria-label="Página anterior"
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage((pageNumber) => pageNumber - 1)}
                  size="icon-sm"
                  variant="outline"
                >
                  <ChevronLeft />
                </Button>
                <Button
                  aria-label="Próxima página"
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage((pageNumber) => pageNumber + 1)}
                  size="icon-sm"
                  variant="outline"
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
