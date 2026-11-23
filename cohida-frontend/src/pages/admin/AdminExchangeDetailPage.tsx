import { AdminPage } from '@/components/admin/AdminPage';

import { ChevronLeft, PackageCheck } from 'lucide-react';
import { Link } from 'react-router';

import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import { commerceStatus } from '@/lib/commerceStatus';
import { StatusMessage } from '@/components/ui/status-message';

// prettier-ignore
import {
  useAdminExchangeDetail,
} from '@/components/admin/exchanges/useAdminExchangeDetail';

function AdminExchangeDetailPageContent({
  request,
  order,
  returnToStock,
  setReturnToStock,
  message,
  setMessage,
  error,
  confirmingCompletion,
  setConfirmingCompletion,
  confirmingDenial,
  setConfirmingDenial,
  update,
}: ReturnType<typeof useAdminExchangeDetail>) {
  if (error && !request)
    return (
      <>
        <p
          className={[
            'rounded-lg border border-danger-border',
            'bg-danger-bg p-4 text-danger-foreground',
          ].join(' ')}
        >
          {error}
        </p>
      </>
    );
  if (!request)
    return (
      <>
        <p className='text-muted-foreground'>Carregando troca...</p>
      </>
    );
  const item = request.orderItemId
    ? order?.items.find(
        (entry) => String(entry.id) === String(request.orderItemId),
      )
    : null;
  const valueCents = request.orderItemId
    ? (item?.unitPriceCents ?? 0) * (item?.quantity ?? 1)
    : (order?.subtotalCents ?? 0);

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
      {confirmingCompletion ? (
        <ConfirmDialog
          confirmLabel='Confirmar recebimento'
          description={[
            'A confirmação gera o cupom ao',
            'cliente e devolve o item ao',
            'estoque se selecionado.',
          ].join(' ')}
          onCancel={() => setConfirmingCompletion(false)}
          onConfirm={() => {
            void update('TROCADO');
            setConfirmingCompletion(false);
          }}
          title='Confirmar itens recebidos?'
        />
      ) : null}
      {confirmingDenial ? (
        <ConfirmDialog
          confirmLabel='Negar troca'
          description={[
            'O cliente será notificado de que a',
            'solicitação foi negada. Essa',
            'decisão não poderá ser desfeita.',
          ].join(' ')}
          onCancel={() => setConfirmingDenial(false)}
          onConfirm={() => {
            void update('TROCA_NEGADA');
            setConfirmingDenial(false);
          }}
          title='Negar esta solicitação?'
        />
      ) : null}
      <div className='mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]'>
        <Card>
          <CardHeader>
            <CardTitle>Solicitação</CardTitle>
            <CardDescription>Dados enviados pelo cliente.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-5 text-sm'>
            <div>
              <p className='text-xs text-muted-foreground'>Escopo</p>
              <p className='mt-1 font-medium'>
                {request.orderItemId
                  ? (item?.productName ?? 'Item do pedido')
                  : 'Compra inteira'}
              </p>
              {item ? (
                <p className='mt-1 text-muted-foreground'>
                  {item.variantLabel} · Quantidade: {item.quantity}
                </p>
              ) : null}
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Valor elegível</p>
              <p className='mt-1 text-lg font-semibold'>
                {formatCurrency(valueCents)}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Motivo</p>
              <p className='mt-1'>{request.reason}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recebimento</CardTitle>
            <CardDescription>
              Apenas disponível após a autorização.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label
              className={[
                'flex items-center gap-3 rounded-lg border',
                'border-input p-3 text-sm',
              ].join(' ')}
            >
              <Checkbox
                checked={returnToStock}
                disabled={request.status !== 'TROCA_AUTORIZADA'}
                onCheckedChange={setReturnToStock}
              />
              <span>
                <span className='block font-medium'>Retornar ao estoque</span>
                <span className='text-muted-foreground'>
                  A reentrada é registrada ao confirmar o recebimento.
                </span>
              </span>
            </label>
            {request.couponCode ? (
              <div className='mt-4'>
                <StatusMessage
                  message={`Cupom emitido: ${request.couponCode}`}
                  variant='success'
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

const getPageHeader = (model: ReturnType<typeof useAdminExchangeDetail>) => {
  const {
    error,
    request,
    order,
    setConfirmingCompletion,
    setConfirmingDenial,
    update,
  } = model;
  if (!request)
    return error
      ? {
          description: 'Não foi possível abrir os dados desta solicitação.',
          title: 'Troca',
          overlap: true,
        }
      : {
          description: [
            'Consulte a solicitação e atualize',
            'o recebimento dos itens.',
          ].join(' '),
          title: 'Troca',
          overlap: true,
        };
  return {
    action: (
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          render={<Link to='/admin/trocas' />}
          size='sm'
          variant='outline'
        >
          <ChevronLeft /> Trocas
        </Button>
        {request.status === 'EM_TROCA' ? (
          <>
            <Button
              onClick={() => void update('TROCA_AUTORIZADA')}
              variant='outline'
            >
              Autorizar troca
            </Button>
            <Button
              onClick={() => setConfirmingDenial(true)}
              variant='destructive'
            >
              Negar troca
            </Button>
          </>
        ) : null}
        {request.status === 'TROCA_AUTORIZADA' ? (
          <Button
            onClick={() => setConfirmingCompletion(true)}
            variant='outline'
          >
            <PackageCheck /> Confirmar recebimento
          </Button>
        ) : null}
      </div>
    ),
    description: [
      'Pedido #',
      String(request.orderId),
      String(order ? ` · ${order.customerName}` : ''),
    ].join(''),
    title: (
      <span className='flex flex-wrap items-center gap-3'>
        Troca #{request.id}
        <Badge variant={commerceStatus(request.status).variant}>
          {commerceStatus(request.status).label}
        </Badge>
      </span>
    ),
    overlap: true,
  };
};

export function AdminExchangeDetailPage() {
  const detail = useAdminExchangeDetail();
  return (
    <AdminPage {...getPageHeader(detail)}>
      <AdminExchangeDetailPageContent {...detail} />
    </AdminPage>
  );
}
