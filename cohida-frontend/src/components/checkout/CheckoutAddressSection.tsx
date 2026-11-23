import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { useCheckout } from './useCheckout';

type Props = { checkout: ReturnType<typeof useCheckout> };

export function CheckoutAddressSection({ checkout }: Props) {
  const {
    deliveryAddresses,
    addressId,
    setAddressId,
    isAddingAddress,
    setIsAddingAddress,
    addAddress,
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
              <MapPin className='size-4' />
            </span>
            <div>
              <h2 className='font-semibold'>Endereço de entrega</h2>
              <p className='text-sm text-muted-foreground'>
                Escolha onde receber seu pedido.
              </p>
            </div>
          </div>
          <div className='mt-4 grid gap-3'>
            {deliveryAddresses.map((address) => (
              <label
                className={[
                  ['flex cursor-pointer gap-3', 'rounded-xl'].join(' '),
                  'border border-border bg-card p-4',
                  'has-checked:border-primary',
                  'has-checked:ring-1',
                  'has-checked:ring-primary',
                ].join(' ')}
                key={address.id}
              >
                <input
                  checked={addressId === address.id}
                  className='mt-1 accent-primary'
                  name='delivery-address'
                  onChange={() => setAddressId(address.id)}
                  type='radio'
                />
                <span>
                  <span className='font-medium'>{address.label}</span>
                  <span
                    className={[
                      'mt-1 block text-sm',
                      'text-muted-foreground',
                    ].join(' ')}
                  >
                    {address.street}, {address.number}
                    <br />
                    {address.neighborhood} · {address.city} - {address.state}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {!isAddingAddress ? (
            <Button
              className='mt-3'
              onClick={() => setIsAddingAddress(true)}
              size='sm'
              variant='outline'
            >
              Adicionar endereço
            </Button>
          ) : null}
          {isAddingAddress ? (
            <form
              className={[
                'mt-3 grid gap-3 rounded-xl border',
                'border-dashed border-border p-4',
                'sm:grid-cols-2',
              ].join(' ')}
              onSubmit={async (event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const address = await addAddress({
                  city: String(formData.get('city') ?? '').trim(),
                  country: 'Brasil',
                  label: String(formData.get('label') ?? '').trim(),
                  neighborhood: String(
                    formData.get('neighborhood') ?? '',
                  ).trim(),
                  number: String(formData.get('number') ?? '').trim(),
                  postalCode: String(formData.get('postalCode') ?? '').trim(),
                  state: String(formData.get('state') ?? '').trim(),
                  street: String(formData.get('street') ?? '').trim(),
                  type: 'delivery',
                });
                setAddressId(address.id);
                setIsAddingAddress(false);
              }}
            >
              <label className='grid gap-1 text-sm'>
                Apelido
                <input
                  className={[
                    'h-9 rounded-lg border border-input',
                    'bg-background px-3',
                  ].join(' ')}
                  name='label'
                  required
                />
              </label>
              <label className='grid gap-1 text-sm'>
                CEP
                <input
                  className={[
                    'h-9 rounded-lg border border-input',
                    'bg-background px-3',
                  ].join(' ')}
                  name='postalCode'
                  required
                />
              </label>
              <label className='grid gap-1 text-sm'>
                Número
                <input
                  className={[
                    'h-9 rounded-lg border border-input',
                    'bg-background px-3',
                  ].join(' ')}
                  name='number'
                  required
                />
              </label>
              <label className='grid gap-1 text-sm sm:col-span-2'>
                Endereço
                <input
                  className={[
                    'h-9 rounded-lg border border-input',
                    'bg-background px-3',
                  ].join(' ')}
                  name='street'
                  required
                />
              </label>
              <label className='grid gap-1 text-sm'>
                Bairro
                <input
                  className={[
                    'h-9 rounded-lg border border-input',
                    'bg-background px-3',
                  ].join(' ')}
                  name='neighborhood'
                  required
                />
              </label>
              <label className='grid gap-1 text-sm'>
                Cidade
                <input
                  className={[
                    'h-9 rounded-lg border border-input',
                    'bg-background px-3',
                  ].join(' ')}
                  name='city'
                  required
                />
              </label>
              <label className='grid gap-1 text-sm'>
                Estado
                <input
                  className={[
                    'h-9 rounded-lg border border-input',
                    'bg-background px-3',
                  ].join(' ')}
                  name='state'
                  required
                />
              </label>
              <div className='flex justify-end gap-2 sm:col-span-2'>
                <Button
                  onClick={() => setIsAddingAddress(false)}
                  type='button'
                  variant='outline'
                >
                  Cancelar
                </Button>
                <Button type='submit'>Usar este endereço</Button>
              </div>
            </form>
          ) : null}
        </section>
      </CardContent>
    </Card>
  );
}
