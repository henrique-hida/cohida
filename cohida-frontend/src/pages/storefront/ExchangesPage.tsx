import { CheckCircle2, PackageOpen, Plus } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination } from '@/components/shared/Pagination';
import { AccountSectionCard } from '@/components/shared/AccountSectionCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCommerce } from '@/data/useCommerce';
import type { CartItem } from '@/types/commerce';

function exchangeItemLabel(item: CartItem) {
  const label = [item.productId, item.variantLabel].filter(Boolean).join(' · ');
  return `${label} × ${item.quantity}`;
}

const exchangeStatus = {
  authorized: 'Troca autorizada',
  completed: 'Troca concluída',
  received: 'Recebimento confirmado',
  requested: 'Solicitação enviada',
  sent: 'Item despachado',
  denied: 'Solicitação negada',
};

export function ExchangesPage() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.set('secao', 'exchanges');
  return <Navigate replace to={'/conta?' + params.toString()} />;
}

export function ExchangesSection() {
  const { requestExchange, state } = useCommerce();
  const [searchParams] = useSearchParams();
  const [isRequesting, setIsRequesting] = useState(
    Boolean(searchParams.get('pedido')),
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderId, setOrderId] = useState(searchParams.get('pedido') ?? '');
  const [itemId, setItemId] = useState('');
  const [wholeOrder, setWholeOrder] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(state.exchanges.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const exchanges = state.exchanges.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const deliveredOrders = state.orders.filter(
    (order) => order.status === 'delivered',
  );
  const selectedOrder =
    deliveredOrders.find((order) => order.id === orderId) ?? deliveredOrders[0];
  const selectedItem =
    selectedOrder?.items.find((item) => item.id === itemId) ??
    selectedOrder?.items[0];
  return (
    <AccountSectionCard
      action={
        <Button
          onClick={() => {
            setIsRequesting(true);
            setIsSubmitted(false);
            setError('');
          }}
        >
          <Plus />
          Solicitar troca
        </Button>
      }
      description='Acompanhe suas solicitações e atualizações.'
      title='Trocas e devoluções'
    >
      <div className='space-y-6'>
        {isRequesting ? (
          <div className='border-b border-border pb-6'>
            {isSubmitted ? (
              <div className='py-4 text-center'>
                <CheckCircle2 className='mx-auto size-10 text-primary' />
                <h2 className='mt-4 text-xl font-semibold'>
                  Solicitação enviada
                </h2>
                <p className='mt-2 text-sm text-muted-foreground'>
                  Vamos analisar sua solicitação e manter você informado.
                </p>
                <Button className='mt-5' onClick={() => setIsRequesting(false)}>
                  Ver solicitações
                </Button>
              </div>
            ) : (
              <>
                <h2 className='text-lg font-semibold'>Nova solicitação</h2>
                <p className='mt-1 text-sm text-muted-foreground'>
                  Apenas itens de pedidos entregues podem ser trocados.
                </p>
                <form
                  className='mt-6 grid gap-4'
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    if (!selectedOrder || (!wholeOrder && !selectedItem))
                      return;
                    const reason = String(formData.get('reason') ?? '');
                    const details = String(
                      formData.get('details') ?? '',
                    ).trim();
                    setError('');
                    setSubmitting(true);
                    try {
                      await requestExchange({
                        orderId: selectedOrder.id,
                        orderItemId: wholeOrder ? null : selectedItem!.id,
                        reason: details ? `${reason}: ${details}` : reason,
                      });
                      setIsSubmitted(true);
                    } catch (cause) {
                      setError(
                        cause instanceof Error
                          ? cause.message
                          : 'Não foi possível solicitar a troca.',
                      );
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  <label className='grid gap-2 text-sm font-medium'>
                    Pedido
                    <Select
                      value={selectedOrder?.id ?? null}
                      onValueChange={(value) => {
                        setOrderId(value ?? '');
                        setItemId('');
                      }}
                      name='orderId'
                    >
                      <SelectTrigger
                        className={[
                          'h-10 w-full bg-background font-normal',
                          'data-[size=default]:h-10',
                        ].join(' ')}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {deliveredOrders.map((order) => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className='flex items-center gap-2 text-sm'>
                    <Checkbox
                      checked={wholeOrder}
                      name='wholeOrder'
                      onCheckedChange={setWholeOrder}
                    />
                    Solicitar troca da compra inteira
                  </label>
                  {!wholeOrder && selectedOrder ? (
                    <label className='grid gap-2 text-sm font-medium'>
                      Item
                      <Select
                        value={selectedItem?.id ?? null}
                        onValueChange={(value) => setItemId(value ?? '')}
                      >
                        <SelectTrigger className='h-10 w-full font-normal'>
                          <SelectValue>
                            {selectedItem
                              ? exchangeItemLabel(selectedItem)
                              : 'Selecione um item'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {selectedOrder.items.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {exchangeItemLabel(item)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </label>
                  ) : null}
                  <label className='grid gap-2 text-sm font-medium'>
                    Motivo
                    <Select
                      defaultValue='Tamanho ou variação incorreta'
                      name='reason'
                    >
                      <SelectTrigger
                        className={[
                          'h-10 w-full bg-background font-normal',
                          'data-[size=default]:h-10',
                        ].join(' ')}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Tamanho ou variação incorreta'>
                          Tamanho ou variação incorreta
                        </SelectItem>
                        <SelectItem value='Produto diferente do esperado'>
                          Produto diferente do esperado
                        </SelectItem>
                        <SelectItem value='Produto com defeito'>
                          Produto com defeito
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                  <label className='grid gap-2 text-sm font-medium'>
                    Conte um pouco mais
                    <textarea
                      className={[
                        'min-h-24 rounded-lg border border-input',
                        'bg-background p-3 font-normal',
                      ].join(' ')}
                      placeholder='Descreva o que aconteceu'
                      name='details'
                      maxLength={800}
                    />
                  </label>
                  <div className='flex gap-2'>
                    <Button
                      disabled={submitting || !selectedOrder}
                      type='submit'
                    >
                      {submitting ? 'Enviando...' : 'Enviar solicitação'}
                    </Button>
                    <Button
                      onClick={() => setIsRequesting(false)}
                      type='button'
                      variant='ghost'
                    >
                      Cancelar
                    </Button>
                  </div>
                  {error ? <p role='alert'>{error}</p> : null}
                </form>
              </>
            )}
          </div>
        ) : null}
        <section>
          <h2 className='text-lg font-semibold'>Solicitações em andamento</h2>
          <div className='mt-2 divide-y divide-border'>
            {exchanges.length ? (
              exchanges.map((request) => {
                return (
                  <div
                    className={[
                      'flex flex-wrap items-center',
                      'justify-between gap-4 py-4 first:pt-0',
                      'last:pb-0',
                    ].join(' ')}
                    key={request.id}
                  >
                    <div
                      className={[
                        'flex flex-wrap items-center',
                        'justify-between gap-4',
                      ].join(' ')}
                    >
                      <div className='flex items-center gap-3'>
                        <span
                          className={[
                            'grid size-10 place-items-center rounded-lg',
                            'bg-muted',
                          ].join(' ')}
                        >
                          <PackageOpen
                            className={['size-5 text-muted-foreground'].join(
                              '',
                            )}
                          />
                        </span>
                        <div>
                          <p className='font-medium'>
                            Solicitação #{request.id}
                          </p>
                          <p className='mt-1 text-sm text-muted-foreground'>
                            Pedido {request.orderId} · {request.reason}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Badge>{exchangeStatus[request.status]}</Badge>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className='py-3 text-sm text-muted-foreground'>
                Você ainda não tem solicitações de troca.
              </p>
            )}
          </div>
          <Pagination
            currentPage={currentPage}
            onPageChange={setPage}
            pageSize={pageSize}
            totalItems={state.exchanges.length}
          />
        </section>
      </div>
    </AccountSectionCard>
  );
}
