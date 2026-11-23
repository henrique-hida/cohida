import { Ellipsis, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import { AccountSectionCard } from '@/components/shared/AccountSectionCard';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCommerce } from '@/data/useCommerce';
import { AddressForm } from './AddressForm';

export function AccountAddresses({
  addresses,
  isAdding,
  onAdd,
  onRemove,
  onUpdate,
  setIsAdding,
}: {
  addresses: ReturnType<typeof useCommerce>['state']['addresses'];
  isAdding: boolean;
  onAdd: ReturnType<typeof useCommerce>['addAddress'];
  onRemove: ReturnType<typeof useCommerce>['removeAddress'];
  onUpdate: ReturnType<typeof useCommerce>['updateAddress'];
  setIsAdding: (value: boolean) => void;
}) {
  const [editingAddress, setEditingAddress] = useState<
    (typeof addresses)[number] | null
  >(null);

  const closeForm = () => {
    setEditingAddress(null);
    setIsAdding(false);
  };

  return (
    <AccountSectionCard
      action={
        <Button
          onClick={() => {
            if (isAdding || editingAddress) {
              closeForm();
            } else {
              setIsAdding(true);
            }
          }}
        >
          {isAdding || editingAddress ? <X /> : <Plus />}
          {isAdding || editingAddress ? 'Cancelar' : 'Adicionar endereço'}
        </Button>
      }
      description='Escolha um endereço para cada entrega.'
      title='Endereços'
    >
      {isAdding || editingAddress ? (
        <AddressForm
          initialAddress={editingAddress ?? undefined}
          onCancel={closeForm}
          onSave={async (address) => {
            if (editingAddress) {
              await onUpdate(editingAddress.id, address);
            } else {
              await onAdd(address);
            }
            closeForm();
          }}
        />
      ) : (
        <div className='divide-y divide-border'>
          {addresses.length ? (
            addresses.map((address) => (
              <div
                className={[
                  'flex flex-wrap items-start justify-between',
                  'gap-3 py-4 first:pt-0 last:pb-0',
                ].join(' ')}
                key={address.id}
              >
                <div>
                  <p className='font-medium'>{address.label}</p>
                  <p className='mt-1 text-sm leading-6 text-muted-foreground'>
                    {address.street}, {address.number}
                    <br />
                    {address.neighborhood} · {address.city} - {address.state}
                  </p>
                </div>
                <div className='flex items-center gap-1'>
                  <Popover>
                    <PopoverTrigger
                      aria-label='Mais ações do endereço'
                      render={<Button size='icon-sm' variant='ghost' />}
                    >
                      <Ellipsis />
                    </PopoverTrigger>
                    <PopoverContent align='end' className='w-40 gap-1 p-1'>
                      <Button
                        className='w-full justify-start'
                        onClick={() => setEditingAddress(address)}
                        variant='ghost'
                      >
                        <Pencil />
                        Editar
                      </Button>
                      <Button
                        className={[
                          'w-full justify-start text-destructive',
                          'hover:text-destructive',
                        ].join(' ')}
                        onClick={() => void onRemove(address.id)}
                        variant='ghost'
                      >
                        <Trash2 />
                        Remover
                      </Button>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ))
          ) : (
            <p className='py-2 text-sm text-muted-foreground'>
              Você ainda não cadastrou endereços.
            </p>
          )}
        </div>
      )}
    </AccountSectionCard>
  );
}
