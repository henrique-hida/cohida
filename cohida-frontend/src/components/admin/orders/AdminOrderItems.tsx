import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import {
  resolveProductImageUrl,
  type ApiOrder,
  type ApiProduct,
} from '@/lib/commerceApi';
import type { Category } from '@/types';

type Props = {
  order: ApiOrder;
  products: ApiProduct[];
  categories: Category[];
};

export function AdminOrderItems({ order, products, categories }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Itens do pedido</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {order.items.map((item) => {
          const product = products.find((entry) =>
            entry.variants.some((variant) => variant.id === item.variantId),
          );
          const variant = product?.variants.find(
            (entry) => entry.id === item.variantId,
          );

          return (
            <div
              className={[
                'flex flex-col gap-4 border-b border-border',
                'pb-4 text-sm last:border-0 sm:flex-row',
              ].join(' ')}
              key={item.id ?? item.variantId}
            >
              {product?.imageUrl ? (
                <img
                  alt={item.productName}
                  className={[
                    'size-20 shrink-0 rounded-lg border',
                    'border-border bg-muted object-cover',
                  ].join(' ')}
                  src={resolveProductImageUrl(product.imageUrl)}
                />
              ) : null}
              <div className='min-w-0 flex-1 space-y-1'>
                <p className='font-semibold'>{item.productName}</p>
                {product ? (
                  <>
                    <p className='text-muted-foreground'>
                      Marca: {product.brand}
                    </p>
                    {product.categoryIds.length ? (
                      <p className='text-muted-foreground'>
                        Categorias:{' '}
                        {product.categoryIds
                          .map(
                            (categoryId) =>
                              categories.find(
                                (category) =>
                                  String(category.id) === String(categoryId),
                              )?.name ?? categoryId,
                          )
                          .join(', ')}
                      </p>
                    ) : null}
                    {product.description ? (
                      <p className='line-clamp-2 text-muted-foreground'>
                        {product.description}
                      </p>
                    ) : null}
                  </>
                ) : null}
                <p className='text-muted-foreground'>
                  Variação: {item.variantLabel}
                  {variant?.color ? ` · ${variant.color}` : ''}
                  {variant?.size ? ` · ${variant.size}` : ''}
                </p>
                <p className='text-muted-foreground'>SKU: {item.sku}</p>
              </div>
              <div
                className={[
                  'flex shrink-0 flex-row justify-between',
                  'gap-4 sm:flex-col sm:items-end',
                  'sm:justify-start',
                ].join(' ')}
              >
                <span className='text-muted-foreground'>
                  {item.quantity} × {formatCurrency(item.unitPriceCents)}
                </span>
                <strong>
                  {formatCurrency(item.unitPriceCents * item.quantity)}
                </strong>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
