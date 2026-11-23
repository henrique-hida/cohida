import { Page } from '@/components/shared/Page';

import { Check, ChevronLeft, X } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
// prettier-ignore
import {
  CheckoutAddressSection,
} from '@/components/checkout/CheckoutAddressSection';
// prettier-ignore
import {
  CheckoutPaymentSection,
} from '@/components/checkout/CheckoutPaymentSection';
// prettier-ignore
import {
  CheckoutOrderSummary,
} from '@/components/checkout/CheckoutOrderSummary';
import { useCheckout } from '@/components/checkout/useCheckout';

function CheckoutPageContent({
  checkout,
}: {
  checkout: ReturnType<typeof useCheckout>;
}) {
  const { completedOrder } = checkout;

  if (completedOrder) {
    const rejected = completedOrder.status === 'rejected';
    return (
      <>
        <div className='mx-auto mt-8 max-w-md text-center'>
          <Card className='py-0 text-left'>
            <CardContent className='p-5 text-sm'>
              <div className='mb-5 flex items-center gap-3'>
                <span
                  className={[
                    'grid size-12 place-items-center',
                    'rounded-full bg-primary',
                    'text-primary-foreground',
                  ].join(' ')}
                >
                  {rejected ? (
                    <X className='size-6' />
                  ) : (
                    <Check className='size-6' />
                  )}
                </span>
                <p className='font-medium'>
                  {rejected ? 'Pagamento recusado' : 'Compra confirmada'}
                </p>
              </div>
              <p className='text-muted-foreground'>Número do pedido</p>
              <p className='mt-1 font-semibold'>#{completedOrder.id}</p>
              <p className='mt-4 text-muted-foreground'>Total</p>
              <p className='mt-1 font-semibold'>
                {formatCurrency(completedOrder.totalCents)}
              </p>
              {completedOrder.issuedCoupon ? (
                <div className='mt-4 rounded-lg bg-primary/10 p-3'>
                  <p className='font-semibold'>Cupom de troca emitido</p>
                  <p className='mt-1'>
                    {completedOrder.issuedCoupon.code} ·{' '}
                    {formatCurrency(completedOrder.issuedCoupon.valueCents)}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (checkout.pendingCheckoutError) {
    return (
      <p className='mt-8 text-center text-sm text-destructive'>
        {checkout.pendingCheckoutError}
      </p>
    );
  }

  if (checkout.pendingCheckout) {
    return (
      <Card className='mx-auto mt-8 max-w-md'>
        <CardContent className='space-y-4 p-5'>
          <p className='font-medium'>Confirme sua tentativa de compra</p>
          <p className='text-sm text-muted-foreground'>
            A resposta anterior não chegou. Consulte o resultado antes de
            iniciar outra compra.
          </p>
          <Button
            className='w-full'
            disabled={checkout.isSubmitting}
            onClick={() =>
              void checkout.submitOrder(checkout.pendingCheckout!.input)
            }
          >
            {checkout.isSubmitting ? 'Consultando...' : 'Consultar pedido'}
          </Button>
          {checkout.checkoutError ? (
            <p className='text-sm text-destructive'>{checkout.checkoutError}</p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div
        className={[
          'mt-8 grid gap-8',
          'lg:grid-cols-[minmax(0,1fr)_22rem]',
          'lg:items-start',
        ].join(' ')}
      >
        <div className='grid gap-6'>
          <CheckoutAddressSection checkout={checkout} />

          <CheckoutPaymentSection checkout={checkout} />
        </div>

        <CheckoutOrderSummary checkout={checkout} />
      </div>
    </>
  );
}

const getPageHeader = ({
  completed,
  rejected,
}: {
  completed: boolean;
  rejected: boolean;
}) => ({
  action: completed ? (
    <Button
      nativeButton={false}
      render={<Link to='/produtos' />}
      variant='outline'
    >
      Continuar comprando
    </Button>
  ) : (
    <Button
      nativeButton={false}
      render={<Link to='/carrinho' />}
      variant='outline'
    >
      <ChevronLeft />
      Voltar ao carrinho
    </Button>
  ),
  description: completed
    ? 'Acompanhe os detalhes do seu pedido.'
    : 'Revise o endereço, a forma de pagamento e os itens antes de confirmar.',
  overlap: true,
  title: completed
    ? rejected
      ? 'Pagamento recusado'
      : 'Pedido em processamento'
    : 'Finalizar pedido',
});

export function CheckoutPage() {
  const checkout = useCheckout();
  const header = getPageHeader({
    completed: Boolean(checkout.completedOrder),
    rejected: checkout.completedOrder?.status === 'rejected',
  });

  return (
    <Page {...header}>
      <CheckoutPageContent checkout={checkout} />
    </Page>
  );
}
