import { Page } from '@/components/shared/Page';
import { useMemo } from 'react';
import { CartSummary } from '@/components/cart/CartSummary';
import { getCartEntries } from '@/components/cart/getCartEntries';
import { ChevronLeft, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import { calculateShippingCents } from '@/lib/shipping';
import { useCommerce } from '@/data/useCommerce';

function CartPageContent({
  entries,
}: {
  entries: ReturnType<typeof getCartEntries>;
}) {
  const { acknowledgeExpiredCartItem, removeCartItem, state, updateCartItem } =
    useCommerce();
  const items = state.cartItems;
  const { subtotalCents, discountCents } = state.cartTotals;
  const deliveryAddress = state.addresses.find(
    (address) => address.type === 'delivery',
  );
  const shippingCents = calculateShippingCents(
    items.reduce((total, item) => total + item.quantity, 0),
    deliveryAddress?.state,
  );
  const totalCents = Math.max(0, subtotalCents - discountCents + shippingCents);
  const hasExpiredItems = state.expiredCartItems.length > 0;

  function updateQuantity(itemId: string, quantity: number) {
    const item = items.find((entry) => entry.id === itemId);
    if (item) void updateCartItem({ ...item, quantity });
  }

  function removeItem(itemId: string) {
    void removeCartItem(itemId);
  }

  if (!state.sessionHydrated) {
    return (
      <>
        <Card className='mt-8 py-0'>
          <CardContent className='p-5 text-sm text-muted-foreground'>
            <p role='status'>Carregando carrinho...</p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      {hasExpiredItems ? (
        <Card
          className={[
            'mt-6 border-warning-border bg-warning-bg',
            'py-0 text-warning-foreground',
          ].join(' ')}
        >
          <CardContent className='p-4 text-sm' role='alert'>
            <p className='font-medium'>
              Alguns itens foram removidos porque a reserva expirou.
            </p>
            <ul className='mt-2 list-disc pl-5'>
              {state.expiredCartItems.map((item) => (
                <li key={item.id}>
                  {item.productName} — {item.quantity} item(ns){' '}
                  <button
                    className='ml-2 underline'
                    onClick={() =>
                      void acknowledgeExpiredCartItem(String(item.id))
                    }
                  >
                    Entendi
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {entries.length ? (
        <div
          className={[
            'mt-8 grid gap-8',
            'lg:grid-cols-[minmax(0,1fr)_22rem]',
            'lg:items-start',
          ].join(' ')}
        >
          <div>
            <Card className='overflow-hidden py-0'>
              <CardContent className='p-0'>
                {entries.map(({ item, product, variant }) => (
                  <article
                    className={[
                      'flex gap-4 border-b border-border p-4',
                      'last:border-b-0 sm:gap-5 sm:p-5',
                    ].join(' ')}
                    key={item.id}
                  >
                    <img
                      alt={product.images[0]?.alt}
                      className={[
                        'size-24 shrink-0 rounded-lg bg-muted',
                        'object-cover sm:size-28',
                      ].join(' ')}
                      src={product.images[0]?.src}
                    />
                    <div className='min-w-0 flex-1'>
                      <div className='flex justify-between gap-3'>
                        <div>
                          <Link
                            className='font-medium hover:text-primary'
                            to={`/produtos/${product.slug}`}
                          >
                            {product.name}
                          </Link>
                          <p className='mt-1 text-sm text-muted-foreground'>
                            {variant.label}
                          </p>
                        </div>
                        <p className='shrink-0 font-semibold'>
                          {formatCurrency(item.unitPriceCents * item.quantity)}
                        </p>
                      </div>
                      <div
                        className={[
                          'mt-5 flex items-center justify-between',
                          'gap-3',
                        ].join(' ')}
                      >
                        <div
                          className={[
                            'flex items-center rounded-lg border',
                            'border-input',
                          ].join(' ')}
                        >
                          <Button
                            aria-label={[
                              'Diminuir quantidade de ',
                              String(product.name),
                            ].join('')}
                            disabled={item.quantity === 1}
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            size='icon-sm'
                            variant='ghost'
                          >
                            <Minus />
                          </Button>
                          <span
                            className={[
                              'w-8 text-center text-sm font-medium',
                            ].join('')}
                          >
                            {item.quantity}
                          </span>
                          <Button
                            aria-label={[
                              'Aumentar quantidade de ',
                              String(product.name),
                            ].join('')}
                            disabled={item.quantity >= variant.stockQuantity}
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            size='icon-sm'
                            variant='ghost'
                          >
                            <Plus />
                          </Button>
                        </div>
                        <Button
                          aria-label={`Remover ${product.name} do carrinho`}
                          onClick={() => removeItem(item.id)}
                          size='sm'
                          variant='ghost'
                        >
                          <Trash2 />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </CardContent>
            </Card>
          </div>

          <CartSummary
            subtotalCents={subtotalCents}
            discountCents={discountCents}
            shippingCents={shippingCents}
            totalCents={totalCents}
            hasExpiredItems={hasExpiredItems}
          />
        </div>
      ) : (
        <Card className='mt-8 min-h-72 py-0'>
          <CardContent
            className={[
              'grid min-h-72 place-items-center p-8',
              'text-center',
            ].join(' ')}
          >
            <div>
              <span
                className={[
                  'mx-auto grid size-12 place-items-center',
                  'rounded-xl bg-muted text-muted-foreground',
                ].join(' ')}
              >
                <ShoppingCart className='size-5' />
              </span>
              <h2 className='mt-4 text-lg font-semibold'>
                Seu carrinho está vazio
              </h2>
              <p className='mt-2 max-w-sm text-sm text-muted-foreground'>
                Explore o catálogo e escolha os equipamentos para o seu próximo
                desafio.
              </p>
              {hasExpiredItems ? (
                <Button className='mt-3' disabled size='lg'>
                  Ir para o checkout
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

const getPageHeader = ({
  count,
  hydrated,
}: {
  count: number;
  hydrated: boolean;
}) => ({
  action: hydrated ? (
    <Button
      nativeButton={false}
      render={<Link to='/produtos' />}
      variant='outline'
    >
      <ChevronLeft />
      Continuar comprando
    </Button>
  ) : null,
  description: !hydrated
    ? 'Confira os produtos que você escolheu.'
    : count
      ? [
          count,
          count === 1 ? 'item' : 'itens',
          'selecionados para sua compra.',
        ].join(' ')
      : [
          'Seu carrinho está vazio. Explore o catálogo',
          'e escolha seus equipamentos.',
        ].join(' '),
  overlap: true,
  title: 'Carrinho',
});

export function CartPage() {
  const { state } = useCommerce();
  const entries = useMemo(() => getCartEntries(state), [state]);
  const header = getPageHeader({
    count: entries.length,
    hydrated: state.sessionHydrated,
  });
  return (
    <Page {...header}>
      <CartPageContent entries={entries} />
    </Page>
  );
}
