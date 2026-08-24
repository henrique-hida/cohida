import { useMemo, useState } from "react";
import { ChevronLeft, ShoppingBag, Star } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";

import { PageContainer, Price, StoreHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { categories, products } from "@/mocks";
import { useCommerce } from "@/data/useCommerce";

export function ProductDetailPage() {
  const { productSlug } = useParams();
  const navigate = useNavigate();
  const product = products.find((item) => item.slug === productSlug);
  const [selectedVariantId, setSelectedVariantId] = useState(
    product?.variants[0]?.id ?? "",
  );
  const { addCartItem, startBuyNow, state } = useCommerce();
  const cartItemCount = state.cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const selectedVariant = useMemo(
    () => product?.variants.find((item) => item.id === selectedVariantId),
    [product, selectedVariantId],
  );

  if (!product) {
    return (
      <PageContainer className="grid min-h-svh place-items-center py-10 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Produto não encontrado</h1>
          <p className="mt-2 text-muted-foreground">
            Este item não está disponível no catálogo.
          </p>
          <Button className="mt-5" render={<Link to="/produtos" />}>
            Voltar ao catálogo
          </Button>
        </div>
      </PageContainer>
    );
  }

  const category = categories.find(
    (item) => item.id === product.categoryIds[0],
  );
  const isAvailable = Boolean(
    selectedVariant && selectedVariant.stockQuantity > 0,
  );

  function addSelectedVariant() {
    if (!selectedVariant) return;
    addCartItem({
      id: `cart-${crypto.randomUUID()}`,
      productId: product!.id,
      quantity: 1,
      unitPriceCents: product!.priceCents,
      variantId: selectedVariant.id,
    });
  }

  return (
    <div className="min-h-svh bg-background">
      <StoreHeader cartItemCount={cartItemCount} />
      <PageContainer className="py-8 sm:py-12">
        <Button render={<Link to="/produtos" />} size="sm" variant="ghost">
          <ChevronLeft />
          Catálogo
        </Button>
        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,.95fr)] lg:items-start">
          <div className="grid aspect-square place-items-center rounded-2xl bg-muted text-8xl font-semibold text-muted-foreground sm:text-9xl">
            {product.images[0] ? (
              <img
                alt={product.images[0].alt}
                className="size-full rounded-2xl object-cover"
                src={product.images[0].src}
              />
            ) : (
              product.name.slice(0, 1)
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">{category?.name}</Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="size-4 fill-primary text-primary" />
                {product.rating.toFixed(1)} · {product.reviewCount} avaliações
              </span>
            </div>
            <p className="mt-6 text-sm font-medium text-primary">
              {product.brand}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-5 leading-7 text-muted-foreground">
              {product.description}
            </p>
            <div className="mt-6">
              <Price
                compareAtPriceCents={product.compareAtPriceCents}
                priceCents={product.priceCents}
              />
            </div>
            <div className="mt-8">
              <p className="text-sm font-medium">
                {product.variants.some((item) => item.size)
                  ? "Tamanho"
                  : "Variação"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <Button
                    aria-pressed={selectedVariantId === variant.id}
                    className="min-w-12"
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    variant={
                      selectedVariantId === variant.id ? "default" : "outline"
                    }
                  >
                    {variant.label}
                  </Button>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {isAvailable
                  ? `${selectedVariant?.stockQuantity} unidades disponíveis`
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
                <ShoppingBag />
                {isAvailable ? "Adicionar ao carrinho" : "Indisponível"}
              </Button>
              <Button
                className="w-full sm:w-auto"
                disabled={!isAvailable}
                onClick={() => {
                  if (!selectedVariant) return;
                  startBuyNow({
                    id: `buy-now-${crypto.randomUUID()}`,
                    productId: product!.id,
                    quantity: 1,
                    unitPriceCents: product!.priceCents,
                    variantId: selectedVariant.id,
                  });
                  navigate("/checkout");
                }}
                size="lg"
              >
                Comprar agora
              </Button>
            </div>
            <Card className="mt-10">
              <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
                {Object.entries(product.attributes).map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs capitalize text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-medium">{value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
