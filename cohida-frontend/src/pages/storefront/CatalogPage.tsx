import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { PageLayout, ProductCard, StoreHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCommerce } from '@/data/useCommerce';
import { useCategories } from '@/data/useCategories';

export function CatalogPage() {
  const { addCartItem, state } = useCommerce();
  const categories = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('busca') ?? '';
  const [cartItemCount, setCartItemCount] = useState(0);
  const category = searchParams.get('categoria') ?? '';
  const categoryId = categories.find((item) => item.slug === category)?.id;
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    return state.products.filter((product) => {
      const matchesCategory =
        !category || (categoryId && product.categoryIds.includes(categoryId));
      const matchesQuery =
        !normalizedQuery ||
        [product.name, product.brand, product.description].some((value) =>
          value.toLocaleLowerCase('pt-BR').includes(normalizedQuery),
        );
      return matchesCategory && matchesQuery;
    });
  }, [category, categoryId, query, state.products]);

  return (
    <div className='min-h-svh bg-background'>
      <StoreHeader cartItemCount={cartItemCount} />
      <PageLayout
        description={[
          String(filteredProducts.length),
          ' ',
          String(
            filteredProducts.length === 1
              ? 'produto encontrado'
              : 'produtos encontrados',
          ),
        ].join('')}
        title='Produtos'
      >
        {filteredProducts.length ? (
          <div
            className={[
              'grid gap-5 sm:grid-cols-2 lg:grid-cols-3',
              'xl:grid-cols-4',
            ].join(' ')}
          >
            {filteredProducts.map((product) => (
              <ProductCard
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
        ) : (
          <Card className='border-dashed py-0'>
            <CardContent className='p-10 text-center'>
              <h2 className='font-medium'>Nenhum produto encontrado</h2>
              <p className='mt-2 text-sm text-muted-foreground'>
                Tente outro termo de busca ou limpe os filtros.
              </p>
              <Button
                className='mt-4'
                onClick={() => {
                  setSearchParams({});
                }}
                variant='outline'
              >
                Limpar filtros
              </Button>
            </CardContent>
          </Card>
        )}
      </PageLayout>
    </div>
  );
}
