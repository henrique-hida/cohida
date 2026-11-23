import { AdminPage } from '@/components/admin/AdminPage';

import {
  ArrowUpRight,
  Boxes,
  CircleAlert,
  ClipboardCheck,
  PackagePlus,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  commerceApi,
  type ApiOrder,
  type ApiProduct,
  type ApiReturn,
} from '@/lib/commerceApi';
import { formatCurrency } from '@/lib/currency';
import { commerceStatus } from '@/lib/commerceStatus';

function getGreeting(hour: number) {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function AdminDashboardPageContent() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [returns, setReturns] = useState<ApiReturn[]>([]);

  useEffect(() => {
    void Promise.all([
      commerceApi.adminOrders(),
      commerceApi.adminProducts(),
      commerceApi.adminReturns(),
    ]).then(([nextOrders, nextProducts, nextReturns]) => {
      setOrders(nextOrders);
      setProducts(nextProducts);
      setReturns(nextReturns);
    });
  }, []);

  const lowStockProducts = products.flatMap((product) => {
    const quantity = product.variants.reduce(
      (total, variant) => total + variant.stockQuantity,
      0,
    );
    return quantity <= product.minimumStock
      ? [
          {
            minimum: product.minimumStock,
            name: product.name,
            quantity,
          },
        ]
      : [];
  });
  const recentOrders = orders.slice(0, 3);
  const revenueCents = orders
    .filter((order) => order.status !== 'CANCELADO')
    .reduce((total, order) => total + order.totalCents, 0);
  const todayOrders = orders.filter(
    (order) =>
      new Date(order.createdAt).toDateString() === new Date().toDateString(),
  ).length;
  const openReturns = returns.filter((request) =>
    ['EM_TROCA', 'TROCA_AUTORIZADA'].includes(request.status),
  ).length;
  const metrics = [
    {
      detail: 'Pedidos não cancelados',
      icon: TrendingUp,
      label: 'Faturamento',
      to: '/admin/analises',
      value: formatCurrency(revenueCents),
    },
    {
      detail: 'Criados hoje',
      icon: ClipboardCheck,
      label: 'Pedidos hoje',
      to: '/admin/pedidos',
      value: String(todayOrders),
    },
    {
      detail: 'No limite mínimo',
      icon: CircleAlert,
      label: 'Alertas de estoque',
      to: '/admin/estoque',
      value: String(lowStockProducts.length),
    },
    {
      detail: 'Aguardando conclusão',
      icon: Boxes,
      label: 'Trocas abertas',
      to: '/admin/trocas',
      value: String(openReturns),
    },
  ];

  return (
    <>
      <section className='mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {metrics.map(({ detail, icon: Icon, label, to, value }) => (
          <Link
            className={[
              'group rounded-xl outline-none',
              'focus-visible:ring-3',
              'focus-visible:ring-ring/50',
            ].join(' ')}
            key={label}
            to={to}
          >
            <Card
              className={[
                'h-full transition-transform',
                'group-hover:-translate-y-0.5',
                'group-hover:ring-primary/60',
              ].join(' ')}
            >
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardDescription>{label}</CardDescription>
                  <Icon aria-hidden='true' className='size-4 text-primary' />
                </div>
                <CardTitle className='text-2xl'>{value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-xs text-muted-foreground'>{detail}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section
        className={[
          'mt-8 grid items-start gap-6 ',
          String(
            lowStockProducts.length > 0
              ? 'xl:grid-cols-[1.4fr_1fr]'
              : 'grid-cols-1',
          ),
        ].join('')}
      >
        <Card>
          <CardHeader className='flex flex-row items-start justify-between'>
            <Button
              render={<Link to='/admin/pedidos' />}
              size='sm'
              variant='ghost'
            >
              Ver todos <ArrowUpRight />
            </Button>
          </CardHeader>
          <CardContent className='overflow-x-auto'>
            <table className='w-full min-w-[32rem] text-left text-sm'>
              <thead
                className={[
                  'border-b border-border text-xs',
                  'tracking-wide text-muted-foreground',
                  'uppercase',
                ].join(' ')}
              >
                <tr>
                  <th className='pb-3 font-medium'>Pedido</th>
                  <th className='pb-3 font-medium'>Cliente</th>
                  <th className='pb-3 font-medium'>Status</th>
                  <th className='pb-3 text-right font-medium'>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    className='border-b border-border last:border-0'
                    key={order.id}
                  >
                    <td className='py-4 font-medium'>#{order.id}</td>
                    <td className='py-4'>{order.customerName}</td>
                    <td className='py-4'>
                      <Badge variant={commerceStatus(order.status).variant}>
                        {commerceStatus(order.status).label}
                      </Badge>
                    </td>
                    <td className='py-4 text-right font-medium'>
                      {formatCurrency(order.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {lowStockProducts.length > 0 ? (
          <Card
            className={[
              'h-fit border-warning-border/70',
              ['bg-warning-bg', 'text-warning-foreground'].join(' '),
              'shadow-sm ring-0',
            ].join(' ')}
          >
            <CardHeader className='flex flex-row items-start gap-3 space-y-0'>
              <span
                className={[
                  ['grid size-10 shrink-0', 'place-items-center'].join(' '),
                  ['rounded-xl border', 'border-warning-border/50'].join(' '),
                  ['bg-background/70', 'text-warning-foreground'].join(' '),
                ].join(' ')}
              >
                <CircleAlert aria-hidden='true' className='size-5' />
              </span>
              <div className='min-w-0'>
                <CardTitle className='text-warning-foreground'>
                  Estoque pede atenção
                </CardTitle>
                <CardDescription className='mt-1 text-warning-foreground/75'>
                  {lowStockProducts.length === 1
                    ? '1 produto no limite mínimo de estoque.'
                    : [
                        String(lowStockProducts.length),
                        ' produtos no limite mínimo de ',
                        'estoque.',
                      ].join('')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='space-y-2'>
                {lowStockProducts.map((product) => (
                  <div
                    className={[
                      'flex flex-wrap items-center',
                      ['justify-between gap-x-4 gap-y-1', 'rounded-lg'].join(
                        ' ',
                      ),
                      'border border-warning-border/40',
                      'bg-background/50 px-3 py-2 text-sm',
                    ].join(' ')}
                    key={product.name}
                  >
                    <span className='min-w-0 flex-1 font-medium'>
                      {product.name}
                    </span>
                    <span className='shrink-0 text-warning-foreground/80'>
                      {product.quantity} / mín. {product.minimum} un.
                    </span>
                  </div>
                ))}
              </div>
              <Button
                className='w-full'
                render={<Link to='/admin/estoque' />}
                variant='outline'
              >
                Ver estoque
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </>
  );
}

const getPageHeader = ({ hour, name }: { hour: number; name: string }) => ({
  action: (
    <Button nativeButton={false} render={<Link to='/admin/produtos' />}>
      <PackagePlus aria-hidden='true' />
      Novo produto
    </Button>
  ),
  description: 'Acompanhe o que precisa de atenção na operação.',
  overlap: true,
  title: `${getGreeting(hour)}, ${name.split(/\s+/)[0] || 'Administradora'}.`,
});

export function AdminDashboardPage() {
  const header = getPageHeader({
    hour: new Date().getHours(),
    name: localStorage.getItem('cohida-admin-name')?.trim() ?? '',
  });

  return (
    <AdminPage {...header}>
      <AdminDashboardPageContent />
    </AdminPage>
  );
}
