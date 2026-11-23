import { CircleHelp } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import type { useCommerce } from '@/data/useCommerce';
import type { Order, Product } from '@/types';

type Props = {
  order: Order;
  products: Product[];
  cancelOrder: ReturnType<typeof useCommerce>['cancelOrder'];
};

export function OrderSummary({ order, products, cancelOrder }: Props) {
  return (
    <Card className='py-0'>
      <CardContent className='p-5'>
        <h2 className='font-semibold'>Resumo do pedido</h2>
        <div className='mt-5 grid gap-4'>
          {order.items.map((item) => {
            const product = products.find((entry) =>
              entry.variants.some((variant) => variant.id === item.variantId),
            );
            const variant = product?.variants.find(
              (entry) => entry.id === item.variantId,
            );
            return (
              <div className='flex min-w-0 gap-3' key={item.id}>
                <img
                  alt={product?.images[0]?.alt ?? item.productId}
                  className={[
                    'size-14 shrink-0 rounded-lg bg-muted',
                    'object-cover',
                  ].join(' ')}
                  src={product?.images[0]?.src}
                />
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-medium'>
                    {product?.name ?? item.productId}
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    {[variant?.label, variant?.sku].filter(Boolean).join(' · ')}
                  </p>
                  <div
                    className={[
                      'mt-2 flex justify-between gap-2',
                      'text-sm',
                    ].join(' ')}
                  >
                    <span className='text-muted-foreground'>
                      {item.quantity} × {formatCurrency(item.unitPriceCents)}
                    </span>
                    <span className='font-medium'>
                      {formatCurrency(item.unitPriceCents * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <dl
          className={[
            'mt-5 grid gap-3 border-t border-border',
            'pt-4 text-sm',
          ].join(' ')}
        >
          <div className='flex justify-between text-muted-foreground'>
            <dt>Subtotal</dt>
            <dd>{formatCurrency(order.subtotalCents)}</dd>
          </div>
          <div className='flex justify-between text-muted-foreground'>
            <dt>Entrega</dt>
            <dd>{formatCurrency(order.shippingCents)}</dd>
          </div>
          <div
            className={[
              'flex justify-between border-t',
              'border-border pt-3 text-base font-semibold',
            ].join(' ')}
          >
            <dt>Total</dt>
            <dd>{formatCurrency(order.totalCents)}</dd>
          </div>
        </dl>
        {order.status === 'delivered' ? (
          <Button
            className='mt-6 w-full'
            render={<Link to={`/trocas?pedido=${order.id}`} />}
            variant='outline'
          >
            <CircleHelp />
            Solicitar troca
          </Button>
        ) : null}
        {order.status === 'processing' ? (
          <Button
            className='mt-3 w-full'
            onClick={() => void cancelOrder(order.id)}
            variant='destructive'
          >
            Cancelar pedido
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
