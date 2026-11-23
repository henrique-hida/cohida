import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useCategories } from '@/data/useCategories';
import { commerceApi, type ApiOrder, type ApiProduct } from '@/lib/commerceApi';

export function useAdminOrderDetail() {
  const categories = useCategories();
  const { orderId } = useParams();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [trackingCode, setTrackingCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  useEffect(() => {
    void Promise.all([
      commerceApi.adminOrders(),
      commerceApi.adminProducts().catch(() => []),
    ])
      .then(([orders, catalog]) => {
        setOrder(orders.find((entry) => String(entry.id) === orderId) ?? null);
        setProducts(catalog);
      })
      .catch((cause: Error) => setError(cause.message));
  }, [orderId]);
  async function dispatch() {
    if (!order) return;
    try {
      setOrder(await commerceApi.dispatchOrder(String(order.id), trackingCode));
      setMessage('Pedido despachado e cliente notificado.');
      setError('');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível despachar.',
      );
    }
  }
  async function deliver() {
    if (!order) return;
    try {
      setOrder(
        await commerceApi.updateOrderStatus(String(order.id), 'ENTREGUE'),
      );
      setMessage('Entrega confirmada.');
      setError('');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível confirmar a entrega.',
      );
    }
  }

  return {
    categories,
    orderId,
    order,
    setOrder,
    products,
    setProducts,
    trackingCode,
    setTrackingCode,
    error,
    setError,
    message,
    setMessage,
    confirmingDelivery,
    setConfirmingDelivery,
    dispatch,
    deliver,
  };
}
