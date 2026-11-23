import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { commerceApi, type ApiOrder, type ApiReturn } from '@/lib/commerceApi';

export function useAdminExchangeDetail() {
  const { exchangeId } = useParams();
  const [request, setRequest] = useState<ApiReturn | null>(null);
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [returnToStock, setReturnToStock] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmingCompletion, setConfirmingCompletion] = useState(false);
  const [confirmingDenial, setConfirmingDenial] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([commerceApi.adminReturns(), commerceApi.adminOrders()])
      .then(([returns, orders]) => {
        if (!active) return;
        const found =
          returns.find((entry) => String(entry.id) === exchangeId) ?? null;
        setRequest(found);
        setOrder(
          found
            ? (orders.find((entry) => entry.id === found.orderId) ?? null)
            : null,
        );
      })
      .catch((cause: Error) => active && setError(cause.message));
    return () => {
      active = false;
    };
  }, [exchangeId]);

  async function update(
    status: 'TROCA_AUTORIZADA' | 'TROCA_NEGADA' | 'TROCADO',
  ) {
    if (!request) return;
    setError('');
    try {
      const updated = await commerceApi.updateReturnStatus(
        String(request.id),
        status,
        status === 'TROCADO' ? returnToStock : undefined,
      );
      setRequest(updated);
      setMessage(
        status === 'TROCA_AUTORIZADA'
          ? 'Troca autorizada e cliente notificado.'
          : status === 'TROCA_NEGADA'
            ? 'Troca negada e cliente notificado.'
            : 'Recebimento confirmado; cupom de troca emitido para o cliente.',
      );
    } catch (cause) {
      const errorMessage =
        cause instanceof Error
          ? cause.message
          : 'Não foi possível atualizar a troca.';
      setError(
        errorMessage === 'Já existe um registro com esses dados.'
          ? [
              'Não foi possível atualizar o',
              'status da troca. Atualize a página',
              'e tente novamente.',
            ].join(' ')
          : errorMessage,
      );
    }
  }

  return {
    exchangeId,
    request,
    setRequest,
    order,
    setOrder,
    returnToStock,
    setReturnToStock,
    message,
    setMessage,
    error,
    setError,
    confirmingCompletion,
    setConfirmingCompletion,
    confirmingDenial,
    setConfirmingDenial,
    update,
  };
}
