import { PackageCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import type { useCheckout } from './useCheckout';

type Props = { checkout: ReturnType<typeof useCheckout> };

export function CheckoutOrderSummary({ checkout }: Props) {
  const {
    entries,
    subtotalCents,
    shippingCents,
    discountCents,
    totalCents,
    applyCouponCode,
    coupon,
    isApplyingCoupon,
    updateCoupon,
    couponError,
    couponCodes,
    removeCouponByCode,
    setCheckoutError,
    selectedPayments,
    paymentAllocations,
    addressId,
    submitOrder,
    isSubmitting,
    checkoutError,
    state,
  } = checkout;
  return (
    <Card className='py-0'>
      <CardContent className='p-5'>
        <div className='flex items-center gap-2'>
          <PackageCheck className='size-5 text-primary' />
          <h2 className='text-lg font-semibold'>Seu pedido</h2>
        </div>
        <ul className='mt-5 grid gap-3 text-sm'>
          {entries.map(({ item, product, variant }) => (
            <li className='flex justify-between gap-4' key={item.id}>
              <span className='text-muted-foreground'>
                {product.name} · {variant.label} × {item.quantity}
              </span>
              <span className='shrink-0 font-medium'>
                {formatCurrency(item.unitPriceCents * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <dl
          className={[
            ['mt-5 grid gap-3 border-t', 'border-border'].join(' '),
            'pt-5 text-sm',
          ].join(' ')}
        >
          <div
            className={[
              'flex justify-between gap-4',
              'text-muted-foreground',
            ].join(' ')}
          >
            <dt>Subtotal</dt>
            <dd>{formatCurrency(subtotalCents)}</dd>
          </div>
          <div
            className={[
              'flex justify-between gap-4',
              'text-muted-foreground',
            ].join(' ')}
          >
            <dt>Entrega</dt>
            <dd>{formatCurrency(shippingCents)}</dd>
          </div>
          {discountCents ? (
            <div className='flex justify-between gap-4 text-primary'>
              <dt>Desconto</dt>
              <dd>-{formatCurrency(discountCents)}</dd>
            </div>
          ) : null}
          <div
            className={[
              ['flex justify-between gap-4', 'text-base'].join(' '),
              'font-semibold text-foreground',
            ].join(' ')}
          >
            <dt>Total</dt>
            <dd>{formatCurrency(totalCents)}</dd>
          </div>
        </dl>
        <form
          className='mt-5 border-t border-border pt-5'
          onSubmit={(event) => {
            event.preventDefault();
            void applyCouponCode(coupon);
          }}
        >
          <label className='text-sm font-medium' htmlFor='coupon'>
            Cupom de desconto
          </label>
          <input
            className={[
              'mt-2 h-9 w-full rounded-lg border',
              ['border-input bg-background px-3', 'text-sm'].join(' '),
              'disabled:opacity-60',
            ].join(' ')}
            disabled={isApplyingCoupon}
            id='coupon'
            name='code'
            onChange={(event) => updateCoupon(event.target.value)}
            placeholder='Digite o código'
            value={coupon}
          />
          {isApplyingCoupon ? (
            <p className='mt-2 text-xs text-muted-foreground' role='status'>
              Aplicando cupom…
            </p>
          ) : couponError ? (
            <p className='mt-2 text-xs text-destructive' role='alert'>
              {couponError}
            </p>
          ) : null}
          {couponCodes.length ? (
            <div className='mt-2 flex flex-wrap gap-2'>
              {couponCodes.map((couponCode) => (
                <span
                  className={[
                    ['inline-flex items-center gap-1', 'rounded-md'].join(' '),
                    'bg-primary/10 px-2 py-1 text-xs',
                    'text-primary',
                  ].join(' ')}
                  key={couponCode}
                >
                  {couponCode} · -{formatCurrency(discountCents)}
                  <Button
                    aria-label={`Remover cupom ${couponCode}`}
                    className='size-4'
                    onClick={() => void removeCouponByCode(couponCode)}
                    size='icon-xs'
                    type='button'
                    variant='ghost'
                  >
                    <X />
                  </Button>
                </span>
              ))}
            </div>
          ) : null}
        </form>
        <Button
          className='mt-6 w-full'
          disabled={isSubmitting}
          onClick={async () => {
            setCheckoutError('');
            try {
              if (!selectedPayments.length)
                throw new Error('Selecione ao menos uma forma de pagamento.');
              if (totalCents > 0 && totalCents < 1000 && !couponCodes.length)
                throw new Error(
                  [
                    'O valor cobrado no cart',
                    'ão deve ser de no mínim',
                    'o R$ 10,00.',
                  ].join(''),
                );
              if (selectedPayments.length > 1) {
                const sum = selectedPayments.reduce(
                  (total, id) => total + (paymentAllocations[id] ?? 0),
                  0,
                );
                if (
                  selectedPayments.some(
                    (id) =>
                      (paymentAllocations[id] ?? 0) <= 0 ||
                      (!couponCodes.length &&
                        (paymentAllocations[id] ?? 0) < 1000),
                  ) ||
                  sum !== totalCents
                )
                  throw new Error(
                    [
                      'Em pagamentos combinado',
                      's, informe valores de a',
                      'o menos R$ 10,00 que to',
                      'talizem o pedido.',
                    ].join(''),
                  );
              }
              const cardId = selectedPayments.find((id) => id !== 'pix');
              if (!addressId || !cardId)
                throw new Error(
                  'Selecione um endereço de entrega e um cartão.',
                );
              await submitOrder({
                deliveryAddressId: addressId,
                cartSignature: [
                  // prettier-ignore
                  state.cartItems
                    .map(
                      (item) =>
                        [
                          item.variantId,
                          item.quantity,
                          item.unitPriceCents,
                        ].join(':'),
                    )
                    .sort()
                    .join(','),
                  [...couponCodes].sort().join(','),
                ].join('|'),
                payments: selectedPayments.map((id) => ({
                  paymentCardId: id,
                  amountCents:
                    selectedPayments.length === 1
                      ? totalCents
                      : (paymentAllocations[id] ?? 0),
                })),
              });
            } catch (reason) {
              setCheckoutError(
                reason instanceof Error
                  ? reason.message
                  : 'Entre em sua conta para finalizar o pedido.',
              );
            }
          }}
          size='lg'
        >
          Confirmar pedido
        </Button>
        {checkoutError ? (
          <p className='mt-3 text-center text-xs text-destructive'>
            {checkoutError}
          </p>
        ) : null}
        <p
          className={[
            'mt-3 text-center text-xs leading-5',
            'text-muted-foreground',
          ].join(' ')}
        >
          Ao confirmar, você concorda com os termos de compra.
        </p>
      </CardContent>
    </Card>
  );
}
