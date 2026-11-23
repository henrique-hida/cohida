import { AdminPage } from '@/components/admin/AdminPage';

import { AdminOrderItems } from '@/components/admin/orders/AdminOrderItems';
import { ChevronLeft, PackageCheck, Truck } from 'lucide-react';
import { Link } from 'react-router';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusMessage } from '@/components/ui/status-message';
import { formatCurrency } from '@/lib/currency';
import { commerceStatus } from '@/lib/commerceStatus';

// prettier-ignore
import {
  useAdminOrderDetail,
} from '@/components/admin/orders/useAdminOrderDetail';

function AdminOrderDetailPageContent({
  categories,
  order,
  products,
  error,
  message,
  setMessage,
  confirmingDelivery,
  setConfirmingDelivery,
  deliver,
}: ReturnType<typeof useAdminOrderDetail>) {
  if (error && !order)
    return (
      <>
        <p
          className={[
            'rounded-lg bg-destructive p-4',
            'text-destructive-foreground',
          ].join(' ')}
        >
          {error}
        </p>
      </>
    );
  if (!order)
    return (
      <>
        <p className='text-muted-foreground'>Carregando pedido...</p>
      </>
    );
  return (
    <>
      {message ? (
        <div className='mt-6'>
          <StatusMessage
            key={message}
            message={message}
            onDismiss={() => setMessage('')}
            variant='success'
          />
        </div>
      ) : null}
      {error ? (
        <div className='mt-4'>
          <StatusMessage message={error} variant='danger' />
        </div>
      ) : null}
      {confirmingDelivery ? (
        <ConfirmDialog
          confirmLabel='Confirmar entrega'
          description='Esta ação só é permitida para pedidos em transporte.'
          onCancel={() => setConfirmingDelivery(false)}
          onConfirm={() => {
            void deliver();
            setConfirmingDelivery(false);
          }}
          title='Confirmar entrega do pedido?'
        />
      ) : null}
      <div className='mt-8 grid gap-6 xl:grid-cols-[1.45fr_1fr]'>
        <AdminOrderItems
          order={order}
          products={products}
          categories={categories}
        />
        <Card>
          <CardHeader>
            <CardTitle>Pagamento e entrega</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            <div className='flex justify-between'>
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotalCents)}</span>
            </div>
            <div className='flex justify-between'>
              <span>Frete</span>
              <span>{formatCurrency(order.shippingCents)}</span>
            </div>
            <div className='flex justify-between'>
              <span>Desconto</span>
              <span>-{formatCurrency(order.discountCents)}</span>
            </div>
            <div className='flex justify-between border-t pt-3 font-semibold'>
              <span>Total</span>
              <span>{formatCurrency(order.totalCents)}</span>
            </div>
            <p className='border-t pt-3 text-muted-foreground'>
              {order.deliveryLabel}: {order.deliveryStreet},{' '}
              {order.deliveryNumber} — {order.deliveryCity}/
              {order.deliveryState}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

const getPageHeader = (model: ReturnType<typeof useAdminOrderDetail>) => {
  const {
    error,
    order,
    trackingCode,
    setTrackingCode,
    setConfirmingDelivery,
    dispatch,
  } = model;
  if (!order)
    return error
      ? {
          description: 'Não foi possível abrir os dados deste pedido.',
          title: 'Pedido',
          overlap: true,
        }
      : {
          description: 'Consulte os itens, o pagamento e a entrega do pedido.',
          title: 'Pedido',
          overlap: true,
        };
  return {
    action: (
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          render={<Link to='/admin/pedidos' />}
          size='sm'
          variant='outline'
        >
          <ChevronLeft /> Pedidos
        </Button>
        {order.status === 'APROVADA' ? (
          <input
            aria-label='Código de rastreio'
            className={[
              'h-11 min-w-0 rounded-lg border',
              'border-primary-foreground/40',
              'bg-primary-foreground/10 px-3 text-sm',
              'text-primary-foreground shadow-sm',
              'backdrop-blur-md',
              'placeholder:text-primary-foreground/65',
              'sm:w-48',
            ].join(' ')}
            onChange={(event) => setTrackingCode(event.target.value)}
            placeholder='Código de rastreio'
            value={trackingCode}
          />
        ) : null}
        {order.status === 'APROVADA' ? (
          <Button
            disabled={!trackingCode.trim()}
            onClick={() => void dispatch()}
            size='sm'
            variant='outline'
          >
            <Truck /> Despachar
          </Button>
        ) : null}
        {order.status === 'EM_TRANSITO' ? (
          <Button
            onClick={() => setConfirmingDelivery(true)}
            size='sm'
            variant='outline'
          >
            <PackageCheck /> Confirmar entrega
          </Button>
        ) : null}
      </div>
    ),
    description: [
      'Cliente: ',
      String(order.customerName),
      ' · ',
      String(order.items.length),
      ' itens no pedido',
    ].join(''),
    title: (
      <span className='flex flex-wrap items-center gap-3'>
        Pedido #{order.id}
        <Badge variant={commerceStatus(order.status).variant}>
          {commerceStatus(order.status).label}
        </Badge>
      </span>
    ),
    overlap: true,
  };
};

export function AdminOrderDetailPage() {
  const detail = useAdminOrderDetail();
  return (
    <AdminPage {...getPageHeader(detail)}>
      <AdminOrderDetailPageContent {...detail} />
    </AdminPage>
  );
}
