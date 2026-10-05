import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";
import { Link, useNavigate } from "react-router";

import { AdminDataState } from "@/components/admin/AdminDataState";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RowActionsMenu } from "@/components/admin/RowActionsMenu";
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
import { useCommerce } from "@/data/useCommerce";

const pageSize = 5;

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
  const [statusFilter, setStatusFilter] = useState("todos");
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
          statusFilter === "todos" ||
          (statusFilter === "ATIVO" && product.status === "active") ||
          (statusFilter === "INATIVO" && product.status === "inactive"),
      )
      .sort((first, second) => {
        const result = first.name.localeCompare(second.name, "pt-BR");
        return sortDirection === "asc" ? result : -result;
      });
  }, [search, sortDirection, state.products, statusFilter]);

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
    <AdminLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Produtos</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Gerencie o catálogo, atributos, precificação e status dos
            equipamentos.
          </p>
        </div>
        <Button render={<Link to="/admin/produtos/novo" />}>
          <Plus />
          Novo produto
        </Button>
      </div>

      <Card className="mt-8">
        <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Lista operacional</CardTitle>
            <CardDescription>Produtos cadastrados na API.</CardDescription>
          </div>
          <div className="flex gap-2">
            <label className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                aria-label="Pesquisar em Produtos"
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
            <select
              aria-label="Filtrar por status"
              className="h-9 max-w-36 rounded-lg border border-input bg-background px-2 text-sm"
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
              value={statusFilter}
            >
              <option value="todos">Todos</option>
              <option value="ATIVO">Ativos</option>
              <option value="INATIVO">Inativos</option>
            </select>
          </div>
        </CardHeader>
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
                        <th className="pb-3 font-medium" key={column}>
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
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                navigate(detailPath);
                              }
                            }}
                            role="link"
                            tabIndex={0}
                          >
                            <td className="py-4 font-medium">{product.name}</td>
                            <td className="py-4">
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
                            product.status === "active" ? "success" : "outline"
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
              {filteredProducts.length ? (
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
                  <span>
                    {(safePage - 1) * pageSize + 1}–
                    {Math.min(safePage * pageSize, filteredProducts.length)} de{" "}
                    {filteredProducts.length}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      aria-label="Página anterior"
                      disabled={safePage === 1}
                      onClick={() =>
                        setCurrentPage((pageNumber) => pageNumber - 1)
                      }
                      size="icon-sm"
                      variant="outline"
                    >
                      <ChevronLeft />
                    </Button>
                    <Button
                      aria-label="Próxima página"
                      disabled={safePage === totalPages}
                      onClick={() =>
                        setCurrentPage((pageNumber) => pageNumber + 1)
                      }
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
