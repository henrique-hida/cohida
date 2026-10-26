import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { AdminDataState } from "@/components/admin/AdminDataState";
import { AdminFilterSelect } from "@/components/admin/AdminFilterSelect";
import { AdminListFiltersCard } from "@/components/admin/AdminListFiltersCard";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { RowActionsMenu } from "@/components/admin/RowActionsMenu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { useCommerce } from "@/data/useCommerce";

const pageSize = 10;

function formatPrice(priceCents: number) {
  return (priceCents / 100).toLocaleString("pt-BR", {
    currency: "BRL",
    style: "currency",
  });
}

export function AdminProductsPage() {
  const navigate = useNavigate();
  const { loadAdminProducts, setProductStatus, state } = useCommerce();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadAdminProducts()
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar os produtos.",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [loadAdminProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    return state.products
      .filter((product) => {
        if (!normalizedSearch) return true;
        return [
          product.name,
          product.sku,
          product.brand,
          product.description,
          ...product.categoryIds,
        ].some((value) =>
          value.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
        );
      })
      .filter(
        (product) =>
          !statusFilter ||
          (statusFilter === "ATIVO" && product.status === "active") ||
          (statusFilter === "INATIVO" && product.status === "inactive"),
      )
      .filter(
        (product) =>
          !categoryFilter || product.categoryIds.includes(categoryFilter),
      )
      .sort((first, second) => {
        const result = first.name.localeCompare(second.name, "pt-BR");
        return sortDirection === "asc" ? result : -result;
      });
  }, [categoryFilter, search, sortDirection, state.products, statusFilter]);

  const categories = useMemo(
    () =>
      [...new Set(state.products.flatMap((product) => product.categoryIds))]
        .filter(Boolean)
        .sort((first, second) => first.localeCompare(second, "pt-BR")),
    [state.products],
  );

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleProducts = filteredProducts.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  async function deactivateProduct(id: string) {
    setError("");
    try {
      await setProductStatus(id, "inactive");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível desativar o produto.",
      );
    }
  }

  function updateSearch(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  return (
    <AdminPageLayout
      action={
        <Button render={<Link to="/admin/produtos/novo" />}>
          <Plus />
          Novo produto
        </Button>
      }
      description="Gerencie o catálogo, atributos, precificação e status dos equipamentos."
      title="Produtos"
    >
      <div className="mt-8 grid gap-4">
        <AdminListFiltersCard>
          <AdminListToolbar
            onSearchChange={updateSearch}
            searchLabel="Pesquisar em produtos"
            searchPlaceholder="Nome, marca, SKU ou categoria"
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
              ariaLabel="Filtrar produtos por status"
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              options={[
                { label: "Ativos", value: "ATIVO" },
                { label: "Inativos", value: "INATIVO" },
              ]}
              placeholder="Status"
              value={statusFilter}
            />
            <AdminFilterSelect
              ariaLabel="Filtrar produtos por categoria"
              onValueChange={(value) => {
                setCategoryFilter(value);
                setCurrentPage(1);
              }}
              options={[
                ...categories.map((category) => ({
                  label: category,
                  value: category,
                })),
              ]}
              placeholder="Categoria"
              value={categoryFilter}
            />
          </AdminListToolbar>
        </AdminListFiltersCard>
        <Card>
          <CardContent>
            {error ? (
              <p
                className="mb-4 rounded-lg bg-error p-3 text-sm text-error-foreground"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            {isLoading ? (
              <AdminDataState
                description="Consultando o catálogo cadastrado."
                title="Carregando produtos"
                variant="loading"
              />
            ) : (
              <>
                <div className="hidden md:block">
                  <Table className="table-fixed text-left">
                    <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                      <tr>
                        {[
                          "Produto",
                          "Categoria",
                          "Estoque",
                          "Preço",
                          "Status",
                        ].map((column) => (
                          <th
                            className={`pb-3 font-medium ${column === "Categoria" ? "pl-6" : ""}`}
                            key={column}
                          >
                            {column}
                          </th>
                        ))}
                        <th className="pb-3 text-right font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleProducts.length ? (
                        visibleProducts.map((product) => {
                          const stock = product.variants.reduce(
                            (total, variant) => total + variant.stockQuantity,
                            0,
                          );
                          const price = product.priceCents;
                          const detailPath = `/admin/produtos/${product.id}`;
                          return (
                            <tr
                              aria-label={`Abrir ${product.name}`}
                              className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50 focus-visible:bg-muted/50"
                              key={product.id}
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
                              <td className="py-4 pr-6 font-medium">
                                {product.name}
                              </td>
                              <td className="py-4 pl-6">
                                {product.categoryIds.join(", ")}
                              </td>
                              <td className="py-4">{stock} un.</td>
                              <td className="py-4">{formatPrice(price)}</td>
                              <td className="py-4">
                                <Badge
                                  variant={
                                    product.status === "active"
                                      ? "success"
                                      : "outline"
                                  }
                                >
                                  {product.status === "active"
                                    ? "ATIVO"
                                    : "INATIVO"}
                                </Badge>
                              </td>
                              <td className="py-4 text-right">
                                <RowActionsMenu
                                  editTo={`${detailPath}/editar`}
                                  label={product.name}
                                  onDelete={() =>
                                    void deactivateProduct(product.id)
                                  }
                                  viewTo={detailPath}
                                />
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="p-0" colSpan={6}>
                            <AdminDataState
                              description={`Não encontramos produtos para “${search || "os filtros selecionados"}”.`}
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
                  {visibleProducts.map((product) => {
                    const stock = product.variants.reduce(
                      (total, variant) => total + variant.stockQuantity,
                      0,
                    );
                    const price = product.priceCents;
                    return (
                      <Link
                        className="block rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
                        key={product.id}
                        to={`/admin/produtos/${product.id}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-medium">{product.name}</span>
                          <Badge
                            variant={
                              product.status === "active"
                                ? "success"
                                : "outline"
                            }
                          >
                            {product.status === "active" ? "ATIVO" : "INATIVO"}
                          </Badge>
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <dt className="text-xs text-muted-foreground">
                              Categoria
                            </dt>
                            <dd>{product.categoryIds.join(", ")}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">
                              Estoque
                            </dt>
                            <dd>{stock} un.</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">
                              Preço
                            </dt>
                            <dd>{formatPrice(price)}</dd>
                          </div>
                        </dl>
                      </Link>
                    );
                  })}
                  {!visibleProducts.length ? (
                    <AdminDataState
                      description={`Não encontramos produtos para “${search || "os filtros selecionados"}”.`}
                      title="Nenhum resultado encontrado"
                      variant="empty"
                    />
                  ) : null}
                </div>
                <AdminPagination
                  currentPage={safePage}
                  onPageChange={setCurrentPage}
                  pageSize={pageSize}
                  totalItems={filteredProducts.length}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
