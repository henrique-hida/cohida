import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { customerApi, type CustomerResponse } from '@/lib/customerApi';

export function useAdminCustomerDetail() {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState<CustomerResponse>();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!customerId) {
        setError('Cliente inválido.');
        return;
      }
      setCustomer(undefined);
      setError('');
      customerApi
        .findById(customerId)
        .then((nextCustomer) => active && setCustomer(nextCustomer))
        .catch((reason) => {
          if (!active) return;
          setError(
            reason instanceof Error
              ? reason.message
              : 'Não foi possível carregar o cliente.',
          );
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [customerId]);
  async function deactivate() {
    if (!customer || !customer.active) return;
    try {
      await customerApi.deactivate(String(customer.id));
      setCustomer({ ...customer, active: false });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível excluir o cliente.',
      );
    }
  }
  return { customer, error, deactivate };
}
