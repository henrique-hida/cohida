import { AdminPage } from '@/components/admin/AdminPage';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useState } from 'react';

import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
// prettier-ignore
import {
  useAdminCustomerDetail,
} from '@/components/admin/customers/useAdminCustomerDetail';

function AdminCustomerDetailPageContent({
  customer,
  error,
}: ReturnType<typeof useAdminCustomerDetail>) {
  if (error && !customer)
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
  return (
    <>
      <section className='rounded-xl border p-5'>
        <p>E-mail: {customer.email}</p>
        <p>Telefone: {customer.phone}</p>
        <p>CPF: {customer.cpf}</p>
      </section>
      <section className='mt-4 rounded-xl border p-5'>
        <h2 className='font-semibold'>Endereços</h2>
        {customer.addresses.map((address) => (
          <p className='mt-3' key={address.id}>
            {address.type}: {address.street}, {address.number} · {address.city}/
            {address.state} · CEP {address.postalCode}
          </p>
        ))}
      </section>
      {error ? <p className='mt-4 text-sm text-destructive'>{error}</p> : null}
    </>
  );
}

const getPageHeader = ({
  customer,
  error,
}: ReturnType<typeof useAdminCustomerDetail>) => ({
  action: customer ? (
    <div className='flex flex-wrap gap-2'>
      <Button
        nativeButton={false}
        render={<Link to='/admin/clientes' />}
        size='sm'
        variant='outline'
      >
        Clientes
      </Button>
      <Button
        nativeButton={false}
        render={<Link to={`/admin/clientes/${customer.id}/editar`} />}
      >
        Editar
      </Button>
    </div>
  ) : null,
  description: customer
    ? `${customer.code} · ${customer.active ? 'ATIVO' : 'INATIVO'}`
    : error
      ? 'Não foi possível abrir os dados deste cliente.'
      : 'Consulte os dados de contato e endereços do cliente.',
  overlap: true,
  title: customer?.name ?? 'Cliente',
});

export function AdminCustomerDetailPage() {
  const detail = useAdminCustomerDetail();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const header = getPageHeader(detail);
  return (
    <AdminPage
      {...header}
      action={
        <div className='flex flex-wrap gap-2'>
          {header.action}
          {detail.customer?.active && (
            <Button onClick={() => setConfirmDelete(true)} variant='outline'>
              Excluir
            </Button>
          )}
        </div>
      }
    >
      <AdminCustomerDetailPageContent {...detail} />
      {confirmDelete && (
        <ConfirmDialog
          title='Excluir cliente?'
          description='O cliente será removido da lista ativa.'
          confirmLabel='Excluir cliente'
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            void detail.deactivate();
          }}
        />
      )}
    </AdminPage>
  );
}
