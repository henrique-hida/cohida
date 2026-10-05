import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { PageContainer, ProductCard, StoreHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useCommerce } from "@/data/useCommerce";
import { useCategories } from "@/data/useCategories";

export function CatalogPage() {
  const { state } = useCommerce();
  const categories = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("busca") ?? "";
  const [cartItemCount, setCartItemCount] = useState(0);
  const category = searchParams.get("categoria") ?? "todas";
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return state.products.filter((product) => {
      const matchesCategory =
        category === "todas" || product.categoryIds.includes(category);
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
      <PageContainer className="py-10 sm:py-14">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">Catálogo coHida</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Encontre o equipamento para o seu próximo desafio.
          </h1>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1
            ? "produto encontrado"
            : "produtos encontrados"}
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard
              categoryName={
                categories.find((item) => item.id === product.categoryIds[0])
                  ?.name
              }
              key={product.id}
              onAddToCart={() => setCartItemCount((count) => count + 1)}
              product={product}
            />
          ))}
        </div>
        {!filteredProducts.length ? (
          <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center">
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
          </div>
        ) : null}
      </PageContainer>
    </div>
  );
}
