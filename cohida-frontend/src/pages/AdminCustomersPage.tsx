import { ArrowDownUp, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import { AdminDataState } from "@/components/admin/AdminDataState";
import { AdminFilterSelect } from "@/components/admin/AdminFilterSelect";
import { AdminListFiltersCard } from "@/components/admin/AdminListFiltersCard";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { RowActionsMenu } from "@/components/admin/RowActionsMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { customerApi, type CustomerResponse } from "@/lib/customerApi";

const pageSize = 10;

export function AdminCustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState(true);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await customerApi.list(
        search,
        page,
        pageSize,
        statusFilter || "ALL",
        sortDirection.toUpperCase(),
      );
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
  }, [page, search, sortDirection, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCustomers(), 0);
    return () => window.clearTimeout(timer);
  }, [loadCustomers]);

  const visibleCustomers = customers;

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

  return (
    <AdminPageLayout
      action={
        <Button render={<Link to="/admin/clientes/novo" />}>
          <Plus />
          Novo cliente
        </Button>
      }
      description="Gerencie os perfis e dados de contato cadastrados na plataforma."
      title="Clientes"
    >
      <div className="mt-8 grid gap-4">
        <AdminListFiltersCard>
          <AdminListToolbar
            onSearchChange={updateSearch}
            searchLabel="Pesquisar em clientes"
            searchPlaceholder="Nome, código, e-mail, CPF ou telefone"
            searchValue={search}
          >
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
              <ArrowDownUp className="text-muted-foreground" />
            </Button>
            <AdminFilterSelect
              ariaLabel="Filtrar clientes por situação"
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(0);
              }}
              options={[
                { label: "Ativos", value: "ACTIVE" },
                { label: "Inativos", value: "INACTIVE" },
              ]}
              placeholder="Situação"
              value={statusFilter}
            />
          </AdminListToolbar>
        </AdminListFiltersCard>
        <Card>
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
                  <Button
                    onClick={() => void loadCustomers()}
                    variant="outline"
                  >
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
                            <th
                              className={`pb-3 font-medium ${column === "E-mail" ? "pr-6" : column === "Telefone" ? "pl-4" : ""}`}
                              key={column}
                            >
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
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
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
                              <td className="truncate py-4 pr-6">
                                {customer.email}
                              </td>
                              <td className="py-4 pl-4">{customer.phone}</td>
                              <td className="py-4 text-right">
                                <RowActionsMenu
                                  editTo={`${detailPath}/editar`}
                                  label={customer.name}
                                  onDelete={
                                    customer.active
                                      ? () => void deactivate(customer.id)
                                      : undefined
                                  }
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
                <AdminPagination
                  currentPage={page + 1}
                  onPageChange={(nextPage) => setPage(nextPage - 1)}
                  pageSize={pageSize}
                  totalItems={totalElements}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
