import { useEffect, useState, type FormEvent } from "react";
import { ChevronLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";

import { AdminDataState } from "@/components/admin/AdminDataState";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { commerceApi } from "@/lib/commerceApi";

export function AdminCategoryFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const categoryId = id ? Number(id) : null;
  const invalidId =
    categoryId !== null && (!Number.isInteger(categoryId) || categoryId <= 0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(isEditing && !invalidId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    if (invalidId || categoryId === null) return;

    let active = true;
    void commerceApi
      .adminCategories()
      .then((categories) => {
        if (!active) return;
        const category = categories.find((item) => item.id === categoryId);
        if (!category) {
          setError("A categoria não foi encontrada.");
          return;
        }
        setName(category.name);
        setDescription(category.description);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar a categoria.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [categoryId, id, invalidId]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const category = { name: name.trim(), description: description.trim() };
      if (categoryId !== null) {
        await commerceApi.updateCategory(categoryId, category);
      } else {
        await commerceApi.createCategory(category);
      }
      navigate("/admin/administracao");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível salvar a categoria.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPageLayout
      action={
        <Button
          render={<Link to="/admin/administracao" />}
          size="sm"
          variant="outline"
        >
          <ChevronLeft aria-hidden="true" />
          Administração
        </Button>
      }
      description={
        isEditing
          ? "Atualize os dados usados para organizar o catálogo."
          : "Defina os dados da categoria para organizar o catálogo."
      }
      title={isEditing ? "Editar categoria" : "Nova categoria"}
    >
      <Card className="mt-8 max-w-3xl">
        <CardContent className="p-5 sm:p-6">
          {loading ? (
            <AdminDataState
              description="Consultando os dados da categoria."
              title="Carregando categoria"
              variant="loading"
            />
          ) : (
            <form className="grid gap-5" onSubmit={(event) => void save(event)}>
              {error || invalidId ? (
                <p className="text-sm text-destructive" role="alert">
                  {error || "Categoria inválida."}
                </p>
              ) : null}
              <label className="grid gap-2 text-sm font-medium">
                Nome
                <input
                  autoComplete="off"
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal"
                  maxLength={100}
                  onChange={(event) => setName(event.target.value)}
                  required
                  value={name}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Descrição
                <textarea
                  className="min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal"
                  maxLength={500}
                  onChange={(event) => setDescription(event.target.value)}
                  value={description}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button disabled={saving} type="submit">
                  {saving
                    ? "Salvando…"
                    : isEditing
                      ? "Salvar alterações"
                      : "Criar categoria"}
                </Button>
                <Button
                  render={<Link to="/admin/administracao" />}
                  type="button"
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}
