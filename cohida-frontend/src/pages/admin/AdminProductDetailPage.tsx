import { AdminPage } from '@/components/admin/AdminPage';

import { ChevronLeft, Pencil, Power } from 'lucide-react';
import { Link } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// prettier-ignore
import {
  useAdminProductDetail,
} from '@/components/admin/products/useAdminProductDetail';
import { formatCurrency } from '@/lib/currency';

function AdminProductDetailPageContent({
  product,
  error,
  categories,
}: ReturnType<typeof useAdminProductDetail>) {
  if (!product) {
    return (
      <>
        <p className={error ? 'text-destructive' : 'text-muted-foreground'}>
          {error || 'Carregando produto...'}
        </p>
      </>
    );
  }

  return (
    <>
      <div className='mt-8 grid gap-6 md:grid-cols-2'>
        {error ? (
          <p className='text-destructive md:col-span-2'>{error}</p>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <p>{product.description}</p>
            <p>
              Categorias:{' '}
              {product.categoryIds
                .map(
                  (categoryId) =>
                    categories.find((item) => item.id === categoryId)?.name ??
                    categoryId,
                )
                .join(', ')}
            </p>
            <Badge
              variant={product.status === 'active' ? 'success' : 'destructive'}
            >
              {product.status === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Variações</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {product.variants.map((variant) => (
              <div className='flex justify-between' key={variant.id}>
                <span>
                  {variant.label} · {variant.sku}
                </span>
                <span>
                  {variant.stockQuantity} un. ·{' '}
                  {formatCurrency(variant.priceCents ?? product.priceCents)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

const getPageHeader = ({
  product,
  error,
  deactivate,
}: ReturnType<typeof useAdminProductDetail>) => ({
  action: product ? (
    <div className='flex flex-wrap gap-2'>
      <Button
        nativeButton={false}
        render={<Link to='/admin/produtos' />}
        size='sm'
        variant='outline'
      >
        <ChevronLeft />
        Produtos
      </Button>
      <Button onClick={() => void deactivate()} size='sm' variant='outline'>
        <Power />
        Desativar
      </Button>
      <Button
        nativeButton={false}
        render={<Link to={`/admin/produtos/${product.id}/editar`} />}
        size='sm'
      >
        <Pencil />
        Editar
      </Button>
    </div>
  ) : null,
  description: product
    ? `${product.sku} · ${product.brand}`
    : error
      ? 'Não foi possível abrir os dados deste produto.'
      : [
          'Consulte os dados comerciais, as categorias',
          'e as variações do produto.',
        ].join(' '),
  overlap: true,
  title: product?.name ?? 'Produto',
});

export function AdminProductDetailPage() {
  const detail = useAdminProductDetail();
  return (
    <AdminPage {...getPageHeader(detail)}>
      <AdminProductDetailPageContent {...detail} />
    </AdminPage>
  );
}
