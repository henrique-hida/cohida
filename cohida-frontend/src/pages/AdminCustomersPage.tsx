import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

import { AdminDataState } from "@/components/admin/AdminDataState";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RowActionsMenu } from "@/components/admin/RowActionsMenu";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { customerApi, type CustomerResponse } from "@/lib/customerApi";

const pageSize = 5;

export function AdminCustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState(true);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await customerApi.list(search, page, pageSize);
      setCustomers(result.content);
      setTotalElements(result.totalElements);
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível carregar os clientes.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const visibleCustomers = useMemo(
    () =>
      [...customers].sort((first, second) => {
        const result = first.name.localeCompare(second.name, "pt-BR");
        return sortDirection === "asc" ? result : -result;
      }),
    [customers, sortDirection],
  );

  function updateSearch(value: string) {
    setSearch(value);
    setPage(0);
  }

  async function deactivate(id: number) {
    setError("");
    try {
      await customerApi.deactivate(String(id));
      await loadCustomers();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível excluir o cliente.",
      );
    }
  }

  const firstVisible = totalElements ? page * pageSize + 1 : 0;
  const lastVisible = Math.min((page + 1) * pageSize, totalElements);

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Clientes</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Gerencie os perfis e dados de contato cadastrados na plataforma.
          </p>
        </div>
        <Button render={<Link to="/admin/clientes/novo" />}>
          <Plus />
          Novo cliente
        </Button>
      </div>

      <Card className="mt-8">
        <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Lista operacional</CardTitle>
            <CardDescription>Clientes cadastrados na API.</CardDescription>
          </div>
          <div className="flex gap-2">
            <label className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                aria-label="Pesquisar em Clientes"
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
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <AdminDataState
              description="Consultando os clientes cadastrados."
              title="Carregando clientes"
              variant="loading"
            />
          ) : error ? (
            <AdminDataState
              action={
                <Button onClick={() => void loadCustomers()} variant="outline">
                  Tentar novamente
                </Button>
              }
              description={error}
              title="Não foi possível carregar os clientes"
              variant="error"
            />
          ) : (
            <>
              <div className="hidden md:block">
                <Table className="table-fixed text-left">
                  <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                    <tr>
                      {["Cliente", "Código", "E-mail", "Telefone"].map(
                        (column) => (
                          <th className="pb-3 font-medium" key={column}>
                            {column}
                          </th>
                        ),
                      )}
                      <th className="pb-3 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCustomers.length ? (
                      visibleCustomers.map((customer) => {
                        const detailPath = `/admin/clientes/${customer.id}`;
                        return (
                          <tr
                            aria-label={`Abrir ${customer.name}`}
                            className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50 focus-visible:bg-muted/50"
                            key={customer.id}
                            onClick={() => navigate(detailPath)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                navigate(detailPath);
                              }
                            }}
                            role="link"
                            tabIndex={0}
                          >
                            <td className="py-4 font-medium">
                              {customer.name}
                            </td>
                            <td className="py-4">{customer.code}</td>
                            <td className="truncate py-4">{customer.email}</td>
                            <td className="py-4">{customer.phone}</td>
                            <td className="py-4 text-right">
                              <RowActionsMenu
                                editTo={`${detailPath}/editar`}
                                label={customer.name}
                                onDelete={() => void deactivate(customer.id)}
                                viewTo={detailPath}
                              />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="p-0" colSpan={5}>
                          <AdminDataState
                            description={`Não encontramos clientes para “${search || "a busca atual"}”.`}
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
                {visibleCustomers.map((customer) => (
                  <Link
                    className="block rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
                    key={customer.id}
                    to={`/admin/clientes/${customer.id}`}
                  >
                    <p className="font-medium">{customer.name}</p>
                    <dl className="mt-3 grid gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">
                          E-mail
                        </dt>
                        <dd>{customer.email}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">
                          Telefone
                        </dt>
                        <dd>{customer.phone}</dd>
                      </div>
                    </dl>
                  </Link>
                ))}
                {!visibleCustomers.length ? (
                  <AdminDataState
                    description={`Não encontramos clientes para “${search || "a busca atual"}”.`}
                    title="Nenhum resultado encontrado"
                    variant="empty"
                  />
                ) : null}
              </div>
              {totalElements ? (
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
                  <span>
                    {firstVisible}–{lastVisible} de {totalElements}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      aria-label="Página anterior"
                      disabled={page === 0}
                      onClick={() => setPage((current) => current - 1)}
                      size="icon-sm"
                      variant="outline"
                    >
                      <ChevronLeft />
                    </Button>
                    <Button
                      aria-label="Próxima página"
                      disabled={lastVisible >= totalElements}
                      onClick={() => setPage((current) => current + 1)}
                      size="icon-sm"
                      variant="outline"
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
