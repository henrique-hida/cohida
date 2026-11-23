import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';

type Props = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  hasExpiredItems: boolean;
};

export function CartSummary({
  subtotalCents,
  discountCents,
  shippingCents,
  totalCents,
  hasExpiredItems,
}: Props) {
  return (
    <Card className='py-0'>
      <CardContent className='p-5'>
        <h2 className='text-lg font-semibold'>Resumo do pedido</h2>
        <dl className='mt-5 grid gap-3 text-sm'>
          <div
            className={[
              'flex justify-between gap-4',
              'text-muted-foreground',
            ].join(' ')}
          >
            <dt>Subtotal</dt>
            <dd>{formatCurrency(subtotalCents)}</dd>
          </div>
          {discountCents ? (
            <div
              className={[
                'flex justify-between gap-4',
                'text-muted-foreground',
              ].join(' ')}
            >
              <dt>Desconto</dt>
              <dd>-{formatCurrency(discountCents)}</dd>
            </div>
          ) : null}
          <div
            className={[
              'flex justify-between gap-4',
              'text-muted-foreground',
            ].join(' ')}
          >
            <dt>Entrega</dt>
            <dd>{formatCurrency(shippingCents)}</dd>
          </div>
          <div
            className={[
              'mt-2 flex justify-between gap-4 border-t',
              'border-border pt-4 text-base font-semibold',
              'text-foreground',
            ].join(' ')}
          >
            <dt>Total</dt>
            <dd>{formatCurrency(totalCents)}</dd>
          </div>
        </dl>
        {hasExpiredItems ? (
          <Button className='mt-6 w-full' disabled size='lg'>
            Ir para o checkout
          </Button>
        ) : (
          <Button
            className='mt-6 w-full'
            render={<Link to='/checkout' />}
            size='lg'
          >
            Ir para o checkout
          </Button>
        )}
        <p
          className={[
            'mt-3 text-center text-xs leading-5',
            'text-muted-foreground',
          ].join(' ')}
        >
          Frete e formas de pagamento serão confirmados no checkout.
        </p>
      </CardContent>
    </Card>
  );
}
