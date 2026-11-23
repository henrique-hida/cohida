import { CardBrandIcon } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  detectCardBrand,
  formatCardNumber,
  formatCvv,
  formatExpiry,
} from '@/lib/card';
import type { useCheckout } from './useCheckout';

type Props = { checkout: ReturnType<typeof useCheckout> };

export function CheckoutNewCardForm({ checkout }: Props) {
  const {
    state,
    addCard,
    setSelectedPayments,
    setIsAddingCard,
    setNewCardNumber,
    setCardCreationError,
    cardCreationError,
    newCardBrand,
  } = checkout;
  return (
    <form
      className={[
        'mt-3 grid gap-3 rounded-xl border',
        'border-dashed border-border p-4',
        'sm:grid-cols-2',
      ].join(' ')}
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const cardNumber = String(form.get('cardNumber') ?? '');
        setCardCreationError('');
        try {
          const created = await addCard(
            {
              brand: detectCardBrand(cardNumber) ?? 'Cartão',
              isPreferred: !state.cards.length,
              label: String(form.get('label') ?? '').trim(),
            },
            cardNumber,
          );
          setSelectedPayments([String(created.id)]);
          setIsAddingCard(false);
          setNewCardNumber('');
        } catch (reason) {
          setCardCreationError(
            reason instanceof Error
              ? reason.message
              : 'Não foi possível cadastrar o cartão.',
          );
        }
      }}
    >
      {cardCreationError ? (
        <p className='text-sm text-destructive sm:col-span-2' role='alert'>
          {cardCreationError}
        </p>
      ) : null}
      <label className='grid gap-1 text-sm'>
        Número do cartão
        <span className='relative'>
          {newCardBrand ? (
            <span
              className={[
                ['pointer-events-none absolute', 'top-1/2'].join(' '),
                'left-3 -translate-y-1/2',
              ].join(' ')}
            >
              <CardBrandIcon brand={newCardBrand} />
            </span>
          ) : null}
          <input
            className={[
              'h-9 w-full rounded-lg border ',
              'border-input bg-background pr-3 ',
              String(newCardBrand ? 'pl-16' : 'pl-3'),
            ].join('')}
            inputMode='numeric'
            name='cardNumber'
            onInput={(event) => {
              const formattedNumber = formatCardNumber(
                event.currentTarget.value,
              );
              event.currentTarget.value = formattedNumber;
              setNewCardNumber(formattedNumber);
            }}
            required
          />
        </span>
      </label>
      <label className='grid gap-1 text-sm'>
        Nome do cartão
        <input
          className={[
            'h-9 rounded-lg border border-input',
            'bg-background px-3',
          ].join(' ')}
          placeholder='Ex.: Cartão principal'
          required
          name='label'
        />
      </label>
      <label className='grid gap-1 text-sm'>
        Validade
        <input
          className={[
            'h-9 rounded-lg border border-input',
            'bg-background px-3',
          ].join(' ')}
          placeholder='MM/AA'
          onInput={(event) => {
            event.currentTarget.value = formatExpiry(event.currentTarget.value);
          }}
          name='expiry'
          required
        />
      </label>
      <label className='grid gap-1 text-sm'>
        CVV
        <input
          className={[
            'h-9 rounded-lg border border-input',
            'bg-background px-3',
          ].join(' ')}
          inputMode='numeric'
          maxLength={4}
          onInput={(event) => {
            event.currentTarget.value = formatCvv(event.currentTarget.value);
          }}
          required
        />
      </label>
      <div className='flex justify-end gap-2 sm:col-span-2'>
        <Button
          onClick={() => {
            setIsAddingCard(false);
            setNewCardNumber('');
            setCardCreationError('');
          }}
          type='button'
          variant='outline'
        >
          Cancelar
        </Button>
        <Button type='submit'>Usar este cartão</Button>
      </div>
    </form>
  );
}
