import { AdminPage } from '@/components/admin/AdminPage';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { customerApi } from '@/lib/customerApi';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { AdminCustomerFormPage } from '@/pages/admin/AdminCustomerCreatePage';
import type { CustomerResponse } from '@/lib/customerApi';

function AdminCustomerEditPageContent({
  customer,
  error,
}: {
  customer?: CustomerResponse;
  error: string;
}) {
  if (error)
    return (
      <>
        <p className='text-destructive'>{error}</p>
        <Button
          className='mt-4'
          render={<Link to='/admin/clientes' />}
          variant='outline'
        >
          Voltar para clientes
        </Button>
      </>
    );
  if (!customer) return <>Carregando cliente...</>;

  const billingAddress = customer.addresses.find(
    (address) => address.type === 'BILLING',
  );
  const deliveryAddress = customer.addresses.find(
    (address) => address.type === 'DELIVERY',
  );

  return (
    <AdminCustomerFormPage
      customer={{ ...customer, billingAddress, deliveryAddress }}
    />
  );
}

const getPageHeader = ({
  customer,
  error,
}: {
  customer?: CustomerResponse;
  error: string;
}) => ({
  action:
    customer && !error ? (
      <Button
        nativeButton={false}
        render={<Link to='/admin/clientes' />}
        size='sm'
        variant='outline'
      >
        Clientes
      </Button>
    ) : null,
  description:
    customer && !error
      ? `Atualize os dados de ${customer.name}.`
      : 'Atualize os dados cadastrais e endereços do cliente.',
  overlap: true,
  title: 'Editar cliente',
});

export function AdminCustomerEditPage() {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState<CustomerResponse>();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!customerId) return;
    customerApi
      .findById(customerId)
      .then(setCustomer)
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível carregar o cliente.',
        ),
      );
  }, [customerId]);

  return (
    <AdminPage {...getPageHeader({ customer, error })}>
      <AdminCustomerEditPageContent customer={customer} error={error} />
    </AdminPage>
  );
}
