import { Page } from '@/components/shared/Page';
import { useEffect, useState } from 'react';
import { commerceApi } from '@/lib/commerceApi';
import { mapProduct } from '@/data/commerce/mappers';
import { useCategories } from '@/data/useCategories';
import { useSearchParams } from 'react-router';

import { ProductCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCommerce } from '@/data/useCommerce';

type Product = ReturnType<typeof useCommerce>['state']['products'][number];

function CatalogPageContent({
  filteredProducts,
}: {
  filteredProducts: Product[];
}) {
  const { addCartItem } = useCommerce();
  const [, setSearchParams] = useSearchParams();

  return (
    <>
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
                });
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
    </>
  );
}

const getPageHeader = ({ count }: { count: number }) => ({
  description: [
    count,
    count === 1 ? 'produto encontrado' : 'produtos encontrados',
  ].join(' '),
  overlap: true,
  title: 'Produtos',
});

export function CatalogPage() {
  const categories = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('busca') ?? '';
  const category = searchParams.get('categoria') ?? '';
  const categoryId = categories.find((item) => item.slug === category)?.id;
  const requestedPage = Number(searchParams.get('pagina') ?? '0');
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage >= 0
      ? requestedPage
      : 0;
  const key = JSON.stringify([page, query, category, categoryId]);
  const [data, setData] = useState<{
    key: string;
    result?: { products: Product[]; total: number; size: number };
    error?: string;
  } | null>(null);
  const result = data?.key === key ? data.result : undefined;
  const error = data?.key === key ? data.error : undefined;

  useEffect(() => {
    let active = true;
    commerceApi
      .productsPage(page, query, categoryId ?? (category ? '-1' : undefined))
      .then((response) => {
        if (active)
          setData({
            key,
            result: {
              ...response,
              products: response.products.map(mapProduct),
            },
          });
      })
      .catch(() => {
        if (active)
          setData({ key, error: 'Não foi possível carregar os produtos.' });
      });
    return () => {
      active = false;
    };
  }, [page, query, category, categoryId, key]);

  function changePage(next: number) {
    const params = new URLSearchParams(searchParams);
    if (next === 0) params.delete('pagina');
    else params.set('pagina', String(next));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <Page {...getPageHeader({ count: result?.total ?? 0 })}>
      {error ? (
        <p role='alert'>{error}</p>
      ) : result ? (
        <>
          <CatalogPageContent filteredProducts={result.products} />
          {result.total > result.size ? (
            <div className='mt-8 flex items-center justify-center gap-4'>
              <Button
                disabled={page === 0}
                onClick={() => changePage(page - 1)}
                variant='outline'
              >
                Anterior
              </Button>
              <span>
                Página {page + 1} de {Math.ceil(result.total / result.size)}
              </span>
              <Button
                disabled={(page + 1) * result.size >= result.total}
                onClick={() => changePage(page + 1)}
                variant='outline'
              >
                Próxima
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <p>Carregando produtos...</p>
      )}
    </Page>
  );
}
