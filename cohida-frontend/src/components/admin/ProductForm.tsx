import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Plus, Save, Trash2, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { AdminCategoryMultiSelect } from "@/components/admin/AdminCategoryMultiSelect";
import {
  adminInputClassName as inputClassName,
  adminSuccessNoticeClassName,
  adminTextareaClassName,
} from "@/components/admin/AdminFormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/data/useCategories";
import { useCommerce } from "@/data/useCommerce";
import { commerceApi, resolveProductImageUrl } from "@/lib/commerceApi";
import type { Product, ProductStatus } from "@/types";

interface VariantDraft {
  id?: string;
  color: string;
  price: string;
  size: string;
  sku: string;
  stock: string;
}

function blankVariant(): VariantDraft {
  return { color: "", price: "", size: "", sku: "", stock: "0" };
}

function variantLabel(variant: Pick<VariantDraft, "color" | "size">) {
  return (
    [variant.color.trim(), variant.size.trim()].filter(Boolean).join(" · ") ||
    "Padrão"
  );
}

export function ProductForm({ product }: { product?: Product }) {
  const categories = useCategories();
  const { saveProduct } = useCommerce();
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    product?.categoryIds ?? [],
  );
  const [status, setStatus] = useState<ProductStatus>(
    product?.status === "inactive" ? "inactive" : "active",
  );
  const [variants, setVariants] = useState<VariantDraft[]>(() =>
    product?.variants.length
      ? product.variants.map((variant) => ({
          id: variant.id,
          color: variant.color ?? "",
          price: String((variant.priceCents ?? product.priceCents) / 100),
          size: variant.size ?? "",
          sku: variant.sku,
          stock: String(variant.stockQuantity),
        }))
      : [blankVariant()],
  );
  const [imageUrl, setImageUrl] = useState(product?.images[0]?.src ?? "");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [localImagePreview, setLocalImagePreview] = useState("");
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  function updateVariant(
    index: number,
    field: keyof Omit<VariantDraft, "id">,
    value: string,
  ) {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant,
      ),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    if (!selectedCategories.length) {
      setError("Selecione ao menos uma categoria.");
      return;
    }

    const skus = variants.map((variant) =>
      variant.sku.trim().toLocaleUpperCase("pt-BR"),
    );
    if (skus.some((sku) => !sku) || new Set(skus).size !== skus.length) {
      setError("Cada variação precisa ter um SKU único.");
      return;
    }

    const optionCombinations = variants.map((variant) =>
      JSON.stringify([
        variant.color.trim().toLocaleLowerCase("pt-BR"),
        variant.size.trim().toLocaleLowerCase("pt-BR"),
      ]),
    );
    if (new Set(optionCombinations).size !== optionCombinations.length) {
      setError("As combinações de cor e tamanho devem ser únicas.");
      return;
    }

    const parsedVariants = variants.map((variant) => ({
      id: variant.id ?? "new",
      sku: variant.sku.trim(),
      label: variantLabel(variant),
      color: variant.color.trim() || undefined,
      size: variant.size.trim() || undefined,
      priceCents: Math.round(Number(variant.price) * 100),
      stockQuantity: Number(variant.stock),
    }));
    if (
      parsedVariants.some(
        (variant) =>
          !Number.isInteger(variant.priceCents) ||
          variant.priceCents <= 0 ||
          !Number.isInteger(variant.stockQuantity) ||
          variant.stockQuantity < 0,
      )
    ) {
      setError("Informe preço e estoque válidos para todas as variações.");
      return;
    }

    setSaving(true);
    try {
      const savedImageUrl = selectedImage
        ? (await commerceApi.uploadProductImage(selectedImage)).imageUrl
        : imageUrl.trim();
      const next: Product = {
        id: product?.id ?? "new",
        sku: product?.sku ?? parsedVariants[0].sku,
        slug: product?.slug ?? "new",
        name: String(form.get("name")),
        brand: String(form.get("brand")),
        description: String(form.get("description")),
        priceCents: Math.min(
          ...parsedVariants.map((variant) => variant.priceCents),
        ),
        status,
        categoryIds: selectedCategories,
        images: savedImageUrl
          ? [
              {
                alt: String(form.get("name")),
                id: `${product?.id ?? "new"}-main`,
                src: savedImageUrl,
              },
            ]
          : [],
        rating: product?.rating ?? 0,
        reviewCount: product?.reviewCount ?? 0,
        attributes: {
          ...(product?.attributes ?? {}),
          minimumStock: String(form.get("minimumStock") ?? 0),
        },
        createdAt: product?.createdAt ?? new Date().toISOString(),
        variants: parsedVariants,
      };
      await saveProduct(next);
      setSaved(true);
      setTimeout(() => navigate("/admin/produtos"), 500);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível salvar o produto.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={(event) => void submit(event)}>
      {saved ? (
        <div className={adminSuccessNoticeClassName}>
          <Check className="size-5" />
          Produto salvo com sucesso.
        </div>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-error p-3 text-sm text-error-foreground">
          {error}
        </p>
      ) : null}
      <Card>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <label>
            Nome
            <input
              className={inputClassName}
              defaultValue={product?.name}
              name="name"
              required
            />
          </label>
          <label>
            Marca
            <input
              className={inputClassName}
              defaultValue={product?.brand}
              name="brand"
              required
            />
          </label>
          <label className="md:col-span-2">
            Descrição
            <textarea
              className={adminTextareaClassName}
              defaultValue={product?.description}
              name="description"
              required
            />
          </label>
          <div className="grid gap-2 md:col-span-2">
            <span className="text-sm font-medium">Foto do produto</span>
            <input
              accept="image/jpeg,image/png,image/webp"
              aria-label="Selecionar foto do produto"
              className="sr-only"
              disabled={saving}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (!file) return;
                if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
                  setError("Envie uma foto PNG, JPEG ou WebP.");
                  event.currentTarget.value = "";
                  return;
                }
                if (file.size > 8 * 1024 * 1024) {
                  setError("A foto deve ter no máximo 8 MB.");
                  event.currentTarget.value = "";
                  return;
                }
                if (objectUrlRef.current) {
                  URL.revokeObjectURL(objectUrlRef.current);
                }
                const previewUrl = URL.createObjectURL(file);
                objectUrlRef.current = previewUrl;
                setSelectedImage(file);
                setLocalImagePreview(previewUrl);
                setImagePreviewError(false);
                setError("");
                event.currentTarget.value = "";
              }}
              ref={imageInputRef}
              type="file"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                disabled={saving}
                onClick={() => imageInputRef.current?.click()}
                type="button"
                variant="outline"
              >
                <Upload aria-hidden="true" />
                {selectedImage ? "Trocar foto" : "Enviar foto"}
              </Button>
              {selectedImage ? (
                <span className="max-w-64 truncate text-sm text-muted-foreground">
                  {selectedImage.name}
                </span>
              ) : null}
              {selectedImage || imageUrl ? (
                <Button
                  aria-label="Remover foto do produto"
                  disabled={saving}
                  onClick={() => {
                    if (objectUrlRef.current) {
                      URL.revokeObjectURL(objectUrlRef.current);
                      objectUrlRef.current = null;
                    }
                    setSelectedImage(null);
                    setLocalImagePreview("");
                    setImageUrl("");
                    setImagePreviewError(false);
                    if (imageInputRef.current) imageInputRef.current.value = "";
                  }}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              ) : null}
            </div>
            {localImagePreview || imageUrl ? (
              imagePreviewError ? (
                <p className="text-sm text-muted-foreground">
                  Não foi possível carregar a prévia desta imagem.
                </p>
              ) : (
                <img
                  alt="Prévia da foto do produto"
                  className="size-32 rounded-lg border border-border bg-muted object-contain p-2"
                  onError={() => setImagePreviewError(true)}
                  src={
                    localImagePreview ||
                    resolveProductImageUrl(imageUrl) ||
                    undefined
                  }
                />
              )
            ) : null}
          </div>
          <div className="grid gap-2 md:col-span-2">
            <span className="text-sm font-medium">Categorias</span>
            <AdminCategoryMultiSelect
              ariaLabel="Selecionar categorias do produto"
              categories={categories}
              onValueChange={setSelectedCategories}
              placeholder="Selecione as categorias"
              showSelectedBadges
              values={selectedCategories}
            />
          </div>
          <label>
            Estoque mínimo
            <input
              className={inputClassName}
              defaultValue={product?.attributes.minimumStock ?? 0}
              min="0"
              name="minimumStock"
              type="number"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Situação
            <Select
              onValueChange={(value) =>
                setStatus(value === "inactive" ? "inactive" : "active")
              }
              value={status}
            >
              <SelectTrigger className="h-10 w-full bg-background data-[size=default]:h-10">
                <SelectValue>
                  {status === "active" ? "Ativo" : "Inativo"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Variações</CardTitle>
          <Button
            onClick={() =>
              setVariants((current) => [...current, blankVariant()])
            }
            size="sm"
            type="button"
            variant="outline"
          >
            <Plus aria-hidden="true" />
            Adicionar variação
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4">
          {variants.map((variant, index) => (
            <div
              className="grid gap-4 rounded-xl border border-border p-4 md:grid-cols-2 xl:grid-cols-3"
              key={variant.id ?? `nova-${index}`}
            >
              <div className="flex items-center justify-between gap-3 md:col-span-2 xl:col-span-3">
                <p className="font-medium">{variantLabel(variant)}</p>
                <Button
                  aria-label={`Remover variação ${variantLabel(variant)}`}
                  disabled={variants.length === 1}
                  onClick={() =>
                    setVariants((current) =>
                      current.filter(
                        (_, variantIndex) => variantIndex !== index,
                      ),
                    )
                  }
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
              <label>
                SKU
                <input
                  className={inputClassName}
                  onChange={(event) =>
                    updateVariant(index, "sku", event.target.value)
                  }
                  required
                  value={variant.sku}
                />
              </label>
              <label>
                Cor
                <input
                  className={inputClassName}
                  onChange={(event) =>
                    updateVariant(index, "color", event.target.value)
                  }
                  placeholder="Opcional"
                  value={variant.color}
                />
              </label>
              <label>
                Tamanho
                <input
                  className={inputClassName}
                  onChange={(event) =>
                    updateVariant(index, "size", event.target.value)
                  }
                  placeholder="Opcional"
                  value={variant.size}
                />
              </label>
              <label>
                Preço (R$)
                <input
                  className={inputClassName}
                  min="0.01"
                  onChange={(event) =>
                    updateVariant(index, "price", event.target.value)
                  }
                  required
                  step="0.01"
                  type="number"
                  value={variant.price}
                />
              </label>
              <label>
                Estoque
                <input
                  className={inputClassName}
                  min="0"
                  onChange={(event) =>
                    updateVariant(index, "stock", event.target.value)
                  }
                  required
                  step="1"
                  type="number"
                  value={variant.stock}
                />
              </label>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex justify-end gap-3">
        <Button
          render={<Link to="/admin/produtos" />}
          type="button"
          variant="outline"
        >
          Cancelar
        </Button>
        <Button disabled={saving} type="submit">
          <Save />
          {saving ? "Salvando…" : "Salvar produto"}
        </Button>
      </div>
    </form>
  );
}
