import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import { CheckoutNewCardForm } from './CheckoutNewCardForm';
import type { useCheckout } from './useCheckout';

type Props = { checkout: ReturnType<typeof useCheckout> };

export function CheckoutPaymentSection({ checkout }: Props) {
  const {
    state,
    selectedPayments,
    togglePayment,
    totalCents,
    couponCodes,
    updatePaymentAmount,
    finishPaymentAmountEdit,
    paymentAmountDrafts,
    paymentAllocations,
    isAddingCard,
    setIsAddingCard,
    setCardCreationError,
  } = checkout;
  return (
    <Card className='py-0'>
      <CardContent className='p-5'>
        <section>
          <div className='flex items-center gap-3'>
            <span
              className={[
                ['grid size-9 place-items-center', 'rounded-lg'].join(' '),
                'bg-primary text-primary-foreground',
              ].join(' ')}
            >
              <CreditCard className='size-4' />
            </span>
            <div>
              <h2 className='font-semibold'>Pagamento</h2>
              <p className='text-sm text-muted-foreground'>
                Selecione como prefere pagar.
              </p>
            </div>
          </div>
          <div className='mt-4 grid gap-3'>
            {[
              ...state.cards.map((card) => ({
                id: card.id,
                label: card.brand,
                description: `Final ${card.lastDigits} · ${card.label}`,
              })),
            ].map((method) => (
              <label
                className={[
                  ['flex cursor-pointer gap-3', 'rounded-xl'].join(' '),
                  'border border-border bg-card p-4',
                  'has-checked:border-primary',
                  'has-checked:ring-1',
                  'has-checked:ring-primary',
                ].join(' ')}
                key={method.id}
              >
                <input
                  checked={selectedPayments.includes(method.id)}
                  className='mt-1 accent-primary'
                  onChange={(event) =>
                    togglePayment(method.id, event.target.checked)
                  }
                  type='checkbox'
                />
                <span>
                  <span className='font-medium'>{method.label}</span>
                  <span
                    className={[
                      'mt-1 block text-sm',
                      'text-muted-foreground',
                    ].join(' ')}
                  >
                    {method.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {selectedPayments.length === 1 ? (
            <p
              className={[
                ['mt-3 rounded-lg bg-muted/50 px-3', 'py-2'].join(' '),
                'text-sm text-muted-foreground',
              ].join(' ')}
            >
              Valor no cartão: {formatCurrency(totalCents)}
            </p>
          ) : selectedPayments.length > 1 ? (
            <div className='mt-3 rounded-xl border border-border p-4'>
              <div
                className={[
                  'mb-3 flex flex-wrap items-center',
                  'justify-between gap-2 text-sm',
                ].join(' ')}
              >
                <span className='font-medium'>Divisão do pagamento</span>
                <span className='text-muted-foreground'>
                  Total: {formatCurrency(totalCents)}
                </span>
              </div>
              <div className='grid gap-3'>
                {selectedPayments.map((id) => (
                  <label className='grid gap-1 text-sm' key={id}>
                    Valor no cartão{' '}
                    {state.cards.find((card) => card.id === id)?.brand}
                    <input
                      className={[
                        'h-9 rounded-lg border border-input',
                        'bg-background px-3',
                      ].join(' ')}
                      max={(totalCents / 100).toFixed(2)}
                      min={couponCodes.length ? '0.01' : '10'}
                      onChange={(event) =>
                        updatePaymentAmount(id, event.target.value)
                      }
                      onBlur={() => finishPaymentAmountEdit(id)}
                      step='0.01'
                      type='number'
                      value={
                        paymentAmountDrafts[id] ??
                        ((paymentAllocations[id] ?? 0) / 100).toFixed(2)
                      }
                    />
                  </label>
                ))}
              </div>
              <p className='mt-3 text-xs text-muted-foreground'>
                Ao ajustar um valor, outro cartão é atualizado para manter o
                total.
              </p>
            </div>
          ) : null}
          {!isAddingCard ? (
            <Button
              className='mt-3'
              onClick={() => {
                setIsAddingCard(true);
                setCardCreationError('');
              }}
              size='sm'
              variant='outline'
            >
              Usar outro cartão
            </Button>
          ) : null}
          {isAddingCard ? <CheckoutNewCardForm checkout={checkout} /> : null}
        </section>
      </CardContent>
    </Card>
  );
}
