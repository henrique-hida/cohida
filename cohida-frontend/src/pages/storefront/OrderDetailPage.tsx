import { Page } from '@/components/shared/Page';
import { useParams } from 'react-router';
import { OrderSummary } from '@/components/order/OrderSummary';
import {
  Check,
  ChevronLeft,
  Clock3,
  MapPin,
  PackageCheck,
  Truck,
} from 'lucide-react';
import { Link } from 'react-router';

import { PageContainer } from '@/components/shared/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCommerce } from '@/data/useCommerce';

const deliverySteps = [
  { icon: Check, label: 'Pedido confirmado' },
  { icon: PackageCheck, label: 'Preparando envio' },
  { icon: Truck, label: 'Em transporte' },
  { icon: MapPin, label: 'Entregue' },
];

function addBusinessDays(date: Date, days: number) {
  const result = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0 && result.getDay() !== 6) addedDays += 1;
  }

  return result;
}

type Order = ReturnType<typeof useCommerce>['state']['orders'][number];

function OrderDetailPageContent({ order }: { order?: Order }) {
  const { cancelOrder, state } = useCommerce();
  if (!order)
    return (
      <div className='bg-background'>
        <PageContainer className='py-20 text-center'>
          <p className='text-muted-foreground'>
            Confira seus pedidos e selecione um para acompanhar.
          </p>
        </PageContainer>
      </div>
    );
  const delivered = [
    'delivered',
    'in_exchange',
    'exchange_authorized',
    'exchanged',
  ].includes(order.status);
  const currentStep = delivered
    ? 3
    : order.status === 'in_transit'
      ? 2
      : order.status === 'approved'
        ? 1
        : 0;
  const statusDates = [
    order.createdAt,
    order.approvedAt,
    order.dispatchedAt,
    order.deliveredAt,
  ];
  const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
  });
  const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeStyle: 'short',
  });
  const estimatedDeliveryDate = addBusinessDays(
    new Date(order.dispatchedAt ?? order.approvedAt ?? order.createdAt),
    5,
  );
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
          <Card className='py-0'>
            <CardContent className='p-5 sm:p-6'>
              <div
                className={[
                  'flex flex-wrap items-center',
                  'justify-between gap-2',
                ].join(' ')}
              >
                <h2 className='font-semibold'>Acompanhamento</h2>
                <span className='text-xs font-medium text-muted-foreground'>
                  Etapa {currentStep + 1} de {deliverySteps.length}
                </span>
              </div>
              <div
                className={[
                  'mt-4 flex items-center gap-3 rounded-xl',
                  'border border-primary/20 bg-background/80',
                  'px-4 py-3 sm:px-5',
                ].join(' ')}
              >
                <span
                  className={[
                    'grid size-10 shrink-0 place-items-center',
                    'rounded-xl bg-primary/10 text-primary',
                  ].join(' ')}
                >
                  {delivered ? (
                    <MapPin className='size-5' />
                  ) : (
                    <Clock3 className='size-5' />
                  )}
                </span>
                <div className='min-w-0 flex-1'>
                  <p className='text-xs font-medium text-muted-foreground'>
                    {delivered ? 'Entrega concluída' : 'Previsão da entrega'}
                  </p>
                  <p className='mt-0.5 font-semibold text-primary'>
                    {dateFormatter.format(
                      order.deliveredAt
                        ? new Date(order.deliveredAt)
                        : estimatedDeliveryDate,
                    )}
                  </p>
                </div>
              </div>
              <ol className='mt-6'>
                {deliverySteps.map((step, index) => {
                  const Icon = step.icon;
                  const isDone = index <= currentStep;
                  return (
                    <li
                      className='relative flex gap-4 pb-7 last:pb-0'
                      key={step.label}
                    >
                      {index < deliverySteps.length - 1 ? (
                        <span
                          aria-hidden='true'
                          className={[
                            'absolute top-8 bottom-0 left-4 z-0 w-0.5',
                            'bg-muted',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'block h-full ',
                              String(
                                index < currentStep
                                  ? 'w-full bg-primary'
                                  : 'w-0',
                              ),
                            ].join('')}
                          />
                        </span>
                      ) : null}
                      <span
                        className={[
                          'relative z-10 grid size-8 ',
                          'place-items-center rounded-full ',
                          String(
                            isDone
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground',
                          ),
                        ].join('')}
                      >
                        <Icon className='size-4' />
                      </span>
                      <div
                        className={[
                          'flex min-w-0 flex-1 flex-col gap-1',
                          'sm:flex-row sm:items-start',
                          'sm:justify-between sm:gap-4',
                        ].join(' ')}
                      >
                        <p
                          className={[
                            'pt-1 text-sm font-medium ',
                            String(
                              isDone
                                ? 'text-foreground'
                                : 'text-muted-foreground',
                            ),
                          ].join('')}
                        >
                          {step.label}
                        </p>
                        <div
                          className={[
                            'text-sm text-muted-foreground sm:min-w-32',
                            'sm:text-right',
                          ].join(' ')}
                        >
                          {statusDates[index]
                            ? (() => {
                                const date = new Date(statusDates[index]);
                                return (
                                  <time dateTime={date.toISOString()}>
                                    <span className='block'>
                                      {dateFormatter.format(date)}
                                    </span>
                                    <span className='mt-0.5 block text-xs'>
                                      {timeFormatter.format(date)}
                                    </span>
                                  </time>
                                );
                              })()
                            : isDone
                              ? 'Data indisponível'
                              : 'Aguardando'}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        </div>
        <OrderSummary
          order={order}
          products={state.products}
          cancelOrder={cancelOrder}
        />
      </div>
    </>
  );
}

const getPageHeader = ({ order }: { order?: Order }) => ({
  action: (
    <Button
      nativeButton={false}
      render={<Link to='/conta?secao=orders' />}
      variant='outline'
    >
      <ChevronLeft />
      Meus pedidos
    </Button>
  ),
  description: order
    ? [
        'Realizado em',
        new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(
          new Date(order.createdAt),
        ),
      ].join(' ')
    : 'Não foi possível encontrar este pedido na sua conta.',
  overlap: Boolean(order),
  title: order ? 'Acompanhe sua entrega' : 'Pedido não encontrado',
});

export function OrderDetailPage() {
  const { orderId } = useParams();
  const { state } = useCommerce();
  const order = state.orders.find((entry) => entry.id === orderId);
  return (
    <Page {...getPageHeader({ order })}>
      <OrderDetailPageContent order={order} />
    </Page>
  );
}
