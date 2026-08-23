import { useState } from "react";
import { Check, Save } from "lucide-react";
import { Link } from "react-router";

import {
  adminInputClassName as inputClassName,
  adminSuccessNoticeClassName,
  adminTextareaClassName,
} from "@/components/admin/AdminFormField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { adminProductFormOptions, type AdminProduct } from "@/mocks";

interface ProductFormProps {
  product?: AdminProduct;
}

export function ProductForm({ product }: ProductFormProps) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const categories = formData.getAll("categories");
    const barcode = String(formData.get("barcode") ?? "").replace(/\D/g, "");
    const dimensions = ["height", "width", "depth", "weight"];
    const hasInvalidDimension = dimensions.some(
      (dimension) => Number(formData.get(dimension)) < 0,
    );
    if (!categories.length) {
      setError("Selecione ao menos uma categoria esportiva.");
      setSaved(false);
      return;
    }
    if (barcode.length < 8 || barcode.length > 14) {
      setError("Informe um código de barras válido, com 8 a 14 dígitos.");
      setSaved(false);
      return;
    }
    const minimumStock = Number(formData.get("minimumStock"));
    if (
      hasInvalidDimension ||
      Number(formData.get("cost")) <= 0 ||
      !Number.isInteger(minimumStock) ||
      minimumStock < 0
    ) {
      setError(
        "Dimensões e estoque mínimo não podem ser negativos; o custo deve ser maior que zero.",
      );
      setSaved(false);
      return;
    }
    setError("");
    setSaved(true);
  }

  return (
    <form className="space-y-6" onSubmit={submitForm}>
      {saved ? (
        <div className={adminSuccessNoticeClassName}>
          <Check aria-hidden="true" className="size-5" />
          {product
            ? "Alterações salvas apenas na interface."
            : "Produto salvo apenas na interface."}{" "}
          A persistência será conectada à API posteriormente.
        </div>
      ) : null}
      {error ? (
        <p
          className="rounded-lg bg-error p-3 text-sm text-error-foreground"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Informações básicas</CardTitle>
          <CardDescription>
            Campos necessários para identificar o equipamento no catálogo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Nome do produto</span>
            <input
              className={inputClassName}
              defaultValue={product?.name}
              name="name"
              placeholder="Ex.: Bola de Futebol Pro X"
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Marca</span>
            <select
              className={inputClassName}
              defaultValue={product?.brand ?? ""}
              name="brand"
              required
            >
              <option disabled value="">
                Selecione uma marca
              </option>
              {adminProductFormOptions.brands.map((brand) => (
                <option key={brand}>{brand}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Código de barras</span>
            <input
              className={inputClassName}
              defaultValue={product?.barcode}
              inputMode="numeric"
              name="barcode"
              placeholder="7890000000000"
              required
            />
            <span className="block text-xs text-muted-foreground">
              Entre 8 e 14 dígitos.
            </span>
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Descrição</span>
            <textarea
              className={adminTextareaClassName}
              defaultValue={product?.description}
              name="description"
              placeholder="Descreva os benefícios, uso e diferenciais do produto."
              required
            />
          </label>
          <fieldset className="space-y-3 md:col-span-2">
            <legend className="text-sm font-medium">
              Categorias esportivas
            </legend>
            <div className="flex flex-wrap gap-2">
              {adminProductFormOptions.categories.map((category) => (
                <label
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/15"
                  key={category}
                >
                  <input
                    className="accent-primary"
                    defaultChecked={product?.categories.includes(category)}
                    name="categories"
                    type="checkbox"
                    value={category}
                  />
                  {category}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Selecione uma ou mais categorias.
            </p>
          </fieldset>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Características e dimensões</CardTitle>
          <CardDescription>
            Registre os atributos específicos do equipamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-medium">Modelo</span>
            <input
              className={inputClassName}
              defaultValue={product?.attributes.model}
              name="model"
              placeholder="Pro X"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Cor</span>
            <input
              className={inputClassName}
              defaultValue={product?.attributes.color}
              name="color"
              placeholder="Branco e preto"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Material</span>
            <input
              className={inputClassName}
              defaultValue={product?.attributes.material}
              name="material"
              placeholder="PU texturizado"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Tamanho</span>
            <input
              className={inputClassName}
              defaultValue={product?.attributes.size}
              name="size"
              placeholder="5"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Altura (cm)</span>
            <input
              className={inputClassName}
              defaultValue={product?.dimensions.height}
              inputMode="decimal"
              min="0"
              name="height"
              placeholder="22"
              required
              type="number"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Largura (cm)</span>
            <input
              className={inputClassName}
              defaultValue={product?.dimensions.width}
              inputMode="decimal"
              min="0"
              name="width"
              placeholder="22"
              required
              type="number"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Profundidade (cm)</span>
            <input
              className={inputClassName}
              defaultValue={product?.dimensions.depth}
              inputMode="decimal"
              min="0"
              name="depth"
              placeholder="22"
              required
              type="number"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Peso (kg)</span>
            <input
              className={inputClassName}
              defaultValue={product?.dimensions.weight.replace(",", ".")}
              inputMode="decimal"
              min="0"
              name="weight"
              placeholder="0,43"
              required
              type="number"
              step="0.01"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Precificação e disponibilidade</CardTitle>
          <CardDescription>
            O preço de venda será calculado a partir do custo e da margem do
            grupo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium">Grupo de precificação</span>
            <select
              className={inputClassName}
              defaultValue={product?.pricingGroup ?? ""}
              name="pricingGroup"
              required
            >
              <option disabled value="">
                Selecione o grupo
              </option>
              {adminProductFormOptions.pricingGroups.map((group) => (
                <option key={group.label} value={group.label}>
                  {group.label} — margem {group.margin}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Custo unitário (R$)</span>
            <input
              className={inputClassName}
              defaultValue={product?.cost
                .replace("R$ ", "")
                .replace(".", "")
                .replace(",", ".")}
              inputMode="decimal"
              min="0"
              name="cost"
              placeholder="0,00"
              required
              type="number"
              step="0.01"
            />
          </label>
          <div className="space-y-2">
            <span className="text-sm font-medium">Preço de venda</span>
            <div className="flex h-10 items-center rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground">
              {product?.salePrice ?? "Calculado ao salvar"}
            </div>
          </div>
          <label className="space-y-2">
            <span className="text-sm font-medium">Estoque mínimo</span>
            <input
              className={inputClassName}
              defaultValue={product?.stock.minimum}
              min="0"
              name="minimumStock"
              placeholder="Ex.: 5"
              required
              type="number"
            />
            <span className="block text-xs text-muted-foreground">
              Gera alerta quando o disponível ficar abaixo deste valor.
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-input px-3 py-3 text-sm md:col-span-2 lg:col-span-3">
            <input
              className="size-4 accent-primary"
              defaultChecked={product?.status !== "INATIVO"}
              name="active"
              type="checkbox"
            />
            <span>
              <span className="block font-medium">Produto ativo</span>
              <span className="block text-xs text-muted-foreground">
                Disponibiliza o produto para venda quando houver estoque.
              </span>
            </span>
            <Badge className="ml-auto" variant="success">
              ATIVO
            </Badge>
          </label>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-3">
        <Button
          render={
            <Link
              to={product ? `/admin/produtos/${product.id}` : "/admin/produtos"}
            />
          }
          type="button"
          variant="outline"
        >
          Cancelar
        </Button>
        <Button type="submit">
          <Save aria-hidden="true" />
          {product ? "Salvar alterações" : "Salvar produto"}
        </Button>
      </div>
    </form>
  );
}
