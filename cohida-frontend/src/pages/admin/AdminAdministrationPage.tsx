import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router";

import { AdminDataState } from "@/components/admin/AdminDataState";
import { AdminListFiltersCard } from "@/components/admin/AdminListFiltersCard";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { commerceApi, type ApiCategory } from "@/lib/commerceApi";

const pageSize = 10;

export function AdminAdministrationPage() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<ApiCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setCategories(await commerceApi.adminCategories());
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível carregar as categorias.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return categories.filter((category) =>
      `${category.name} ${category.description} ${category.slug}`
        .toLocaleLowerCase("pt-BR")
        .includes(term),
    );
  }, [categories, search]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / pageSize),
  );
  const safePage = Math.min(page, totalPages);
  const visibleCategories = filteredCategories.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  async function removeCategory() {
    if (!deleting) return;
    setError("");
    try {
      await commerceApi.deleteCategory(deleting.id);
      setCategories((current) =>
        current.filter((category) => category.id !== deleting.id),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível remover a categoria.",
      );
    } finally {
      setDeleting(null);
    }
  }

  return (
    <AdminPageLayout
      action={
        <Button render={<Link to="/admin/administracao/nova" />}>
          <Plus aria-hidden="true" />
          Nova categoria
        </Button>
      }
      description="Gerencie as categorias que organizam o catálogo e filtram as análises."
      title="Administração"
    >
      <div className="mt-8 grid gap-4">
        <AdminListFiltersCard>
          <AdminListToolbar
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchLabel="Pesquisar categorias"
            searchPlaceholder="Nome, descrição ou slug"
            searchValue={search}
          />
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
            {loading ? (
              <AdminDataState
                description="Consultando as categorias cadastradas."
                title="Carregando categorias"
                variant="loading"
              />
            ) : visibleCategories.length ? (
              <>
                <div className="divide-y divide-border">
                  {visibleCategories.map((category) => (
                    <div
                      className="flex flex-wrap items-center justify-between gap-4 py-4"
                      key={category.id}
                    >
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {category.description || "Sem descrição"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          /{category.slug}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          aria-label={`Editar ${category.name}`}
                          render={
                            <Link
                              to={`/admin/administracao/${category.id}/editar`}
                            />
                          }
                          size="icon-sm"
                          variant="outline"
                        >
                          <Pencil />
                        </Button>
                        <Button
                          aria-label={`Excluir ${category.name}`}
                          onClick={() => setDeleting(category)}
                          size="icon-sm"
                          variant="destructive"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <AdminPagination
                  currentPage={safePage}
                  onPageChange={setPage}
                  pageSize={pageSize}
                  totalItems={filteredCategories.length}
                />
              </>
            ) : (
              <AdminDataState
                description={
                  search
                    ? "A busca não encontrou categorias."
                    : "Cadastre uma categoria para começar a organizar o catálogo."
                }
                title={
                  search ? "Nenhum resultado encontrado" : "Nenhuma categoria"
                }
                variant="empty"
              />
            )}
          </CardContent>
        </Card>
      </div>
      {deleting ? (
        <ConfirmDialog
          confirmLabel="Excluir categoria"
          description={`A categoria “${deleting.name}” deixará de aparecer no catálogo. Produtos já cadastrados não serão alterados.`}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void removeCategory()}
          title="Excluir categoria?"
        />
      ) : null}
    </AdminPageLayout>
  );
}
