import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router';

// prettier-ignore
import {
  CustomerRegistrationForm,
} from '@/components/customer/CustomerRegistrationForm';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { AdminPage } from '@/components/admin/AdminPage';
import {
  customerApi,
  type CustomerAddressInput,
  type CustomerResponse,
} from '@/lib/customerApi';

type CustomerFormValues = Pick<
  CustomerResponse,
  'id' | 'name' | 'birthDate' | 'cpf' | 'phone' | 'email'
> & {
  billingAddress?: CustomerAddressInput;
  deliveryAddress?: CustomerAddressInput;
};

export function AdminCustomerFormPage({
  customer,
}: {
  customer?: CustomerFormValues;
}) {
  const [successMessage, setSuccessMessage] = useState('');
  const isEditing = Boolean(customer);

  return (
    <>
      <div className='max-w-3xl'>
        <CustomerRegistrationForm
          cancelAction={
            <Button
              render={<Link to='/admin/clientes' />}
              type='button'
              variant='outline'
            >
              Cancelar
            </Button>
          }
          compactActions
          includePassword={!isEditing}
          initialValues={customer}
          onSubmit={async (input) => {
            if (isEditing && customer) {
              const update = {
                name: input.name,
                birthDate: input.birthDate,
                phone: input.phone,
                email: input.email,
                billingAddress: input.billingAddress,
                deliveryAddress: input.deliveryAddress,
              };
              await customerApi.update(String(customer.id), update);
            } else await customerApi.create(input);
            setSuccessMessage(
              isEditing
                ? 'Alterações salvas com sucesso.'
                : 'Cliente salvo com sucesso.',
            );
          }}
          submitLabel={isEditing ? 'Salvar alterações' : 'Salvar cliente'}
        />
      </div>
      {successMessage ? (
        <Toast message={successMessage} onClose={() => setSuccessMessage('')} />
      ) : null}
    </>
  );
}

export function AdminCustomerCreatePage() {
  return (
    <AdminPage
      action={
        <Button
          nativeButton={false}
          render={<Link to='/admin/clientes' />}
          size='sm'
          variant='outline'
        >
          <ChevronLeft aria-hidden='true' />
          Clientes
        </Button>
      }

      description='Cadastre os dados do cliente.'
      overlap
      title='Novo cliente'
    >
      <AdminCustomerFormPage />
    </AdminPage>
  );
}
