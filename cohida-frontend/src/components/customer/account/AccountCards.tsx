import { Ellipsis, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import { AccountSectionCard } from '@/components/shared/AccountSectionCard';
import { CardBrandIcon } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCommerce } from '@/data/useCommerce';
import {
  detectCardBrand,
  formatCardNumber,
  formatCvv,
  formatExpiry,
} from '@/lib/card';

export function AccountCards({
  cards,
  isAdding,
  onAdd,
  onRemove,
  onSetPreferred,
  onUpdate,
  setIsAdding,
}: {
  cards: ReturnType<typeof useCommerce>['state']['cards'];
  isAdding: boolean;
  onAdd: ReturnType<typeof useCommerce>['addCard'];
  onRemove: ReturnType<typeof useCommerce>['removeCard'];
  onSetPreferred: ReturnType<typeof useCommerce>['setPreferredCard'];
  onUpdate: ReturnType<typeof useCommerce>['updateCard'];
  setIsAdding: (value: boolean) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCardNumber, setNewCardNumber] = useState('');
  const newCardBrand = detectCardBrand(newCardNumber);
  return (
    <AccountSectionCard
      action={
        <Button
          onClick={() => {
            setIsAdding(!isAdding);
            setNewCardNumber('');
          }}
        >
          {isAdding ? <X /> : <Plus />}
          {isAdding ? 'Cancelar' : 'Adicionar cartão'}
        </Button>
      }
      description='Gerencie seus cartões cadastrados.'
      title='Cartões'
    >
      {isAdding ? (
        <form
          className={[
            'grid gap-3 rounded-xl border border-dashed',
            'border-border p-4 sm:grid-cols-2',
          ].join(' ')}
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const number = String(formData.get('number') ?? '');
            onAdd(
              {
                brand: detectCardBrand(number) ?? 'Cartão',
                isPreferred: !cards.length,
                label: String(formData.get('label') ?? 'Novo cartão'),
              },
              number,
            );
            setIsAdding(false);
            setNewCardNumber('');
          }}
        >
          <label className='grid gap-1 text-sm'>
            Número do cartão
            <span className='relative'>
              {newCardBrand ? (
                <span
                  className={[
                    'pointer-events-none absolute top-1/2',
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
                name='number'
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
              className='h-9 rounded-lg border border-input bg-background px-3'
              placeholder='Ex.: Cartão principal'
              required
              name='label'
            />
          </label>
          <label className='grid gap-1 text-sm'>
            Validade
            <input
              className='h-9 rounded-lg border border-input bg-background px-3'
              placeholder='MM/AA'
              onInput={(event) => {
                event.currentTarget.value = formatExpiry(
                  event.currentTarget.value,
                );
              }}
              required
            />
          </label>
          <label className='grid gap-1 text-sm'>
            CVV
            <input
              className='h-9 rounded-lg border border-input bg-background px-3'
              inputMode='numeric'
              maxLength={4}
              onInput={(event) => {
                event.currentTarget.value = formatCvv(
                  event.currentTarget.value,
                );
              }}
              required
            />
          </label>
          <div className='flex justify-end gap-2 sm:col-span-2'>
            <Button
              onClick={() => {
                setIsAdding(false);
                setNewCardNumber('');
              }}
              type='button'
              variant='outline'
            >
              Cancelar
            </Button>
            <Button type='submit'>Salvar cartão</Button>
          </div>
        </form>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2'>
          {cards.length ? (
            cards.map((card) => (
              <div
                className='rounded-xl border border-border bg-muted/35 p-4'
                key={card.id}
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='font-medium'>
                        {card.brand} · {card.lastDigits}
                      </p>
                      {card.isPreferred ? (
                        <span
                          className={[
                            'inline-flex items-center gap-1',
                            'rounded-full bg-primary/10 px-2 py-0.5',
                            'text-xs font-medium text-primary',
                          ].join(' ')}
                        >
                          <Star className='size-3 fill-current' />
                          Favorito
                        </span>
                      ) : null}
                    </div>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      {card.label}
                    </p>
                  </div>
                  <div className='flex shrink-0 items-center gap-1'>
                    {!card.isPreferred ? (
                      <Button
                        aria-label='Definir como cartão favorito'
                        onClick={() => onSetPreferred(card.id)}
                        size='icon-sm'
                        data-tooltip='Definir como cartão favorito'
                        variant='ghost'
                      >
                        <Star />
                      </Button>
                    ) : null}
                    <Popover>
                      <PopoverTrigger
                        aria-label='Mais ações do cartão'
                        render={<Button size='icon-sm' variant='ghost' />}
                      >
                        <Ellipsis />
                      </PopoverTrigger>
                      <PopoverContent align='end' className='w-40 gap-1 p-1'>
                        <Button
                          className='w-full justify-start'
                          onClick={() => setEditingId(card.id)}
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
                          onClick={() => onRemove(card.id)}
                          variant='ghost'
                        >
                          <Trash2 />
                          Remover
                        </Button>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                {editingId === card.id ? (
                  <form
                    className='mt-3 grid gap-2'
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      onUpdate(card.id, {
                        brand: card.brand,
                        label: String(formData.get('label') ?? ''),
                      });
                      setEditingId(null);
                    }}
                  >
                    <input
                      className={[
                        'h-9 rounded-lg border border-input',
                        'bg-background px-3 text-sm',
                      ].join(' ')}
                      defaultValue={card.label}
                      name='label'
                      required
                    />
                    <div className='flex justify-end gap-2'>
                      <Button size='sm' type='submit'>
                        Salvar
                      </Button>
                      <Button
                        onClick={() => setEditingId(null)}
                        size='sm'
                        type='button'
                        variant='ghost'
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                ) : null}
              </div>
            ))
          ) : (
            <p
              className={[
                'rounded-xl border border-dashed',
                'border-border bg-muted/30 px-4 py-6',
                'text-sm text-muted-foreground',
                'sm:col-span-2',
              ].join(' ')}
            >
              Você ainda não cadastrou nenhum cartão. Adicione um cartão para
              agilizar o pagamento das próximas compras.
            </p>
          )}
        </div>
      )}
    </AccountSectionCard>
  );
}
