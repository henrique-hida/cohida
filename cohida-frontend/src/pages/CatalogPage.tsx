import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { PageContainer, ProductCard, StoreHeader } from "@/components/shared";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCommerce } from "@/data/useCommerce";
import { useCategories } from "@/data/useCategories";

export function CatalogPage() {
  const { addCartItem, state } = useCommerce();
  const categories = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("busca") ?? "";
  const [cartItemCount, setCartItemCount] = useState(0);
  const category = searchParams.get("categoria") ?? "";
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return state.products.filter((product) => {
      const matchesCategory =
        !category || product.categoryIds.includes(category);
      const matchesQuery =
        !normalizedQuery ||
        [product.name, product.brand, product.description].some((value) =>
          value.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
        );
      return matchesCategory && matchesQuery;
    });
  }, [category, query, state.products]);

  return (
    <div className="min-h-svh bg-background">
      <StoreHeader cartItemCount={cartItemCount} />
      <div className="relative isolate pb-8">
        <PageHeader
          description="Encontre o equipamento para o seu próximo desafio."
          eyebrow="Catálogo coHida"
          title="Produtos"
        />
        <PageContainer className="relative z-10 -mt-9 px-5 sm:-mt-12 sm:px-8">
          <Card className="mt-8 py-0">
            <CardContent className="px-4 py-3 text-sm text-muted-foreground sm:px-5">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1
                ? "produto encontrado"
                : "produtos encontrados"}
            </CardContent>
          </Card>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                categoryName={
                  categories.find((item) => item.id === product.categoryIds[0])
                    ?.name
                }
                key={product.id}
                onAddToCart={(selectedProduct, variant) => {
                  void addCartItem({
                    id: `catalog-${crypto.randomUUID()}`,
                    productId: selectedProduct.id,
                    quantity: 1,
                    unitPriceCents:
                      variant.priceCents ?? selectedProduct.priceCents,
                    variantId: variant.id,
                  }).then(() => setCartItemCount((count) => count + 1));
                }}
                product={product}
              />
            ))}
          </div>
          {!filteredProducts.length ? (
            <Card className="mt-5 border-dashed py-0">
              <CardContent className="p-10 text-center">
                <h2 className="font-medium">Nenhum produto encontrado</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tente outro termo de busca ou limpe os filtros.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setSearchParams({});
                  }}
                  variant="outline"
                >
                  Limpar filtros
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </PageContainer>
      </div>
    </div>
  );
}
