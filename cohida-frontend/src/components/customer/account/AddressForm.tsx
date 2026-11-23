import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCommerce } from '@/data/useCommerce';

export function AddressForm({
  initialAddress,
  onCancel,
  onSave,
}: {
  initialAddress?: ReturnType<typeof useCommerce>['state']['addresses'][number];
  onCancel: () => void;
  onSave: (
    address: Omit<
      ReturnType<typeof useCommerce>['state']['addresses'][number],
      'id'
    >,
  ) => Promise<void>;
}) {
  const [addressType, setAddressType] = useState<'billing' | 'delivery'>(
    initialAddress?.type ?? 'delivery',
  );

  return (
    <form
      className={[
        'grid gap-3 rounded-xl border border-dashed',
        'border-border p-4 sm:grid-cols-2',
      ].join(' ')}
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const value = (field: string) => String(formData.get(field) ?? '');
        await onSave({
          city: value('city'),
          country: value('country'),
          label: value('label'),
          neighborhood: value('neighborhood'),
          number: value('number'),
          postalCode: value('postalCode'),
          state: value('state'),
          street: value('street'),
          type: value('type') as 'billing' | 'delivery',
        });
      }}
    >
      <label className='grid gap-1 text-sm'>
        Apelido
        <input
          className='h-9 rounded-lg border border-input bg-background px-3'
          name='label'
          placeholder='Ex.: Academia'
          required
          defaultValue={initialAddress?.label}
        />
      </label>
      <label className='grid gap-1 text-sm'>
        CEP
        <input
          className='h-9 rounded-lg border border-input bg-background px-3'
          name='postalCode'
          required
          defaultValue={initialAddress?.postalCode}
        />
      </label>
      <label className='grid gap-1 text-sm sm:col-span-2'>
        Endereço
        <input
          className='h-9 rounded-lg border border-input bg-background px-3'
          required
          name='street'
          defaultValue={initialAddress?.street}
        />
      </label>
      <label className='grid gap-1 text-sm'>
        Número
        <input
          className='h-9 rounded-lg border border-input bg-background px-3'
          name='number'
          required
          defaultValue={initialAddress?.number}
        />
      </label>
      <label className='grid gap-1 text-sm'>
        Bairro
        <input
          className='h-9 rounded-lg border border-input bg-background px-3'
          name='neighborhood'
          required
          defaultValue={initialAddress?.neighborhood}
        />
      </label>
      <label className='grid gap-1 text-sm'>
        Cidade
        <input
          className='h-9 rounded-lg border border-input bg-background px-3'
          name='city'
          required
          defaultValue={initialAddress?.city}
        />
      </label>
      <label className='grid gap-1 text-sm'>
        Estado
        <input
          className='h-9 rounded-lg border border-input bg-background px-3'
          name='state'
          required
          defaultValue={initialAddress?.state}
        />
      </label>
      <label className='grid gap-1 text-sm'>
        País
        <input
          className='h-9 rounded-lg border border-input bg-background px-3'
          defaultValue={initialAddress?.country ?? 'Brasil'}
          name='country'
          required
        />
      </label>
      <label className='grid gap-1 text-sm'>
        Tipo de endereço
        <Select
          name='type'
          onValueChange={(value) => {
            if (value === 'billing' || value === 'delivery') {
              setAddressType(value);
            }
          }}
          value={addressType}
        >
          <SelectTrigger
            className={[
              'h-9 w-full bg-background',
              'data-[size=default]:h-9',
            ].join(' ')}
          >
            <SelectValue>
              {addressType === 'billing' ? 'Cobrança' : 'Entrega'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='delivery'>Entrega</SelectItem>
            <SelectItem value='billing'>Cobrança</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <div className='flex justify-end gap-2 sm:col-span-2'>
        <Button onClick={onCancel} type='button' variant='ghost'>
          Cancelar
        </Button>
        <Button type='submit'>Salvar endereço</Button>
      </div>
    </form>
  );
}
