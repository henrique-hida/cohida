import { useMemo, useState } from "react";
import { ChevronLeft, ShoppingCart, Star } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";

import { PageContainer, Price, StoreHeader } from "@/components/shared";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCommerce } from "@/data/useCommerce";
import { useCategories } from "@/data/useCategories";

export function ProductDetailPage() {
  const { productSlug } = useParams();
  const navigate = useNavigate();
  const { addCartItem, startBuyNow, state } = useCommerce();
  const categories = useCategories();
  const product = state.products.find((item) => item.slug === productSlug);
  const [selectedVariantId, setSelectedVariantId] = useState(
    product?.variants[0]?.id ?? "",
  );
  const [buyNowError, setBuyNowError] = useState("");
  const cartItemCount = state.cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const selectedVariant = useMemo(
    () => product?.variants.find((item) => item.id === selectedVariantId),
    [product, selectedVariantId],
  );
  const currentVariant =
    selectedVariant ??
    product?.variants.find((variant) => variant.stockQuantity > 0) ??
    product?.variants[0];
  const selectedPriceCents =
    currentVariant?.priceCents ?? product?.priceCents ?? 0;
  const colorOptions = [
    ...new Set(product?.variants.map((variant) => variant.color ?? "") ?? []),
  ];
  const sizeOptions = [
    ...new Set(product?.variants.map((variant) => variant.size ?? "") ?? []),
  ];
  const hasColorOptions = colorOptions.some(Boolean);
  const hasSizeOptions = sizeOptions.some(Boolean);

  if (!product) {
    return (
      <div className="min-h-svh bg-background">
        <StoreHeader />
        <PageHeader
          action={
            <Button render={<Link to="/produtos" />} variant="outline">
              <ChevronLeft />
              Catálogo
            </Button>
          }
          description="Este item não está disponível no catálogo."
          title="Produto não encontrado"
        />
        <PageContainer className="relative z-10 -mt-9 px-5 sm:-mt-12 sm:px-8">
          <Card className="mt-8 py-0">
            <CardContent className="p-5 text-sm text-muted-foreground">
              <p>Confira outros produtos disponíveis no catálogo.</p>
            </CardContent>
          </Card>
        </PageContainer>
      </div>
    );
  }

  const category = categories.find(
    (item) => item.id === product.categoryIds[0],
  );
  const isAvailable = Boolean(
    currentVariant && currentVariant.stockQuantity > 0,
  );

  function selectOption(axis: "color" | "size", value: string) {
    if (!product) return;
    const candidates = product.variants.filter(
      (variant) => (variant[axis] ?? "") === value,
    );
    const otherAxis = axis === "color" ? "size" : "color";
    const currentValue = currentVariant?.[otherAxis] ?? "";
    const sameOtherOption = candidates.filter(
      (variant) => (variant[otherAxis] ?? "") === currentValue,
    );
    const preferred = sameOtherOption.length ? sameOtherOption : candidates;
    const nextVariant =
      preferred.find((variant) => variant.stockQuantity > 0) ??
      candidates.find((variant) => variant.stockQuantity > 0) ??
      preferred[0] ??
      candidates[0];
    if (nextVariant) setSelectedVariantId(nextVariant.id);
  }

  function optionIsAvailable(axis: "color" | "size", value: string) {
    if (!product) return false;
    const candidates = product.variants.filter(
      (variant) => (variant[axis] ?? "") === value,
    );
    return candidates.some((variant) => variant.stockQuantity > 0);
  }

  function addSelectedVariant() {
    if (!currentVariant) return;
    addCartItem({
      id: `cart-${crypto.randomUUID()}`,
      productId: product!.id,
      quantity: 1,
      unitPriceCents: selectedPriceCents,
      variantId: currentVariant.id,
    });
  }

  async function buyNow() {
    if (!product || !currentVariant) return;

    setBuyNowError("");
    try {
      await startBuyNow({
        id: `buy-now-${crypto.randomUUID()}`,
        productId: product.id,
        quantity: 1,
        unitPriceCents: selectedPriceCents,
        variantId: currentVariant.id,
      });
      navigate("/checkout");
    } catch (reason) {
      setBuyNowError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível iniciar a compra.",
      );
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <StoreHeader cartItemCount={cartItemCount} />
      <div className="relative isolate pb-8">
        <PageHeader
          action={
            <Button render={<Link to="/produtos" />} variant="outline">
              <ChevronLeft />
              Catálogo
            </Button>
          }
          description={product.description}
          eyebrow={product.brand}
          title={product.name}
        />
        <PageContainer className="relative z-10 -mt-9 px-5 sm:-mt-12 sm:px-8">
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,.95fr)] lg:items-start">
            <Card className="aspect-square overflow-hidden py-0">
              <div className="grid size-full place-items-center bg-muted text-8xl font-semibold text-muted-foreground sm:text-9xl">
                {product.images[0] ? (
                  <img
                    alt={product.images[0].alt}
                    className="size-full object-cover"
                    src={product.images[0].src}
                  />
                ) : (
                  product.name.slice(0, 1)
                )}
              </div>
            </Card>
            <Card className="py-0">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary">{category?.name}</Badge>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="size-4 fill-primary text-primary" />
                    {product.rating.toFixed(1)} · {product.reviewCount}{" "}
                    avaliações
                  </span>
                </div>
                <div className="mt-6">
                  <Price
                    compareAtPriceCents={product.compareAtPriceCents}
                    priceCents={selectedPriceCents}
                  />
                </div>
                <div className="mt-8 space-y-5">
                  {hasColorOptions ? (
                    <div>
                      <p className="text-sm font-medium">Cor</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {colorOptions.map((color) => (
                          <Button
                            aria-pressed={
                              (currentVariant?.color ?? "") === color
                            }
                            disabled={!optionIsAvailable("color", color)}
                            key={color || "sem-cor"}
                            onClick={() => selectOption("color", color)}
                            variant={
                              (currentVariant?.color ?? "") === color
                                ? "default"
                                : "outline"
                            }
                          >
                            {color || "Padrão"}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {hasSizeOptions ? (
                    <div>
                      <p className="text-sm font-medium">Tamanho</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {sizeOptions.map((size) => (
                          <Button
                            aria-pressed={(currentVariant?.size ?? "") === size}
                            disabled={!optionIsAvailable("size", size)}
                            key={size || "sem-tamanho"}
                            onClick={() => selectOption("size", size)}
                            variant={
                              (currentVariant?.size ?? "") === size
                                ? "default"
                                : "outline"
                            }
                          >
                            {size || "Padrão"}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {!hasColorOptions &&
                  !hasSizeOptions &&
                  product.variants.length > 1 ? (
                    <div>
                      <p className="text-sm font-medium">Variação</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {product.variants.map((variant) => (
                          <Button
                            aria-pressed={currentVariant?.id === variant.id}
                            disabled={variant.stockQuantity <= 0}
                            key={variant.id}
                            onClick={() => setSelectedVariantId(variant.id)}
                            variant={
                              currentVariant?.id === variant.id
                                ? "default"
                                : "outline"
                            }
                          >
                            {variant.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <p className="mt-3 text-sm text-muted-foreground">
                    {isAvailable
                      ? `${currentVariant?.stockQuantity} unidades disponíveis`
                      : "Variação indisponível"}
                  </p>
                </div>
                <div className="mt-8 grid gap-2 sm:flex">
                  <Button
                    className="w-full sm:w-auto"
                    disabled={!isAvailable}
                    onClick={addSelectedVariant}
                    size="lg"
                    variant="outline"
                  >
                    <ShoppingCart />
                    {isAvailable ? "Adicionar ao carrinho" : "Indisponível"}
                  </Button>
                  <Button
                    className="w-full sm:w-auto"
                    disabled={!isAvailable}
                    onClick={() => void buyNow()}
                    size="lg"
                  >
                    Comprar agora
                  </Button>
                </div>
                {buyNowError ? (
                  <p className="mt-3 text-sm text-destructive">{buyNowError}</p>
                ) : null}
                <div className="mt-8 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
                  {Object.entries(product.attributes).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs capitalize text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
