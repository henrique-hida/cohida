import { AdminPage } from '@/components/admin/AdminPage';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router';

import { ProductForm } from '@/components/admin/ProductForm';
import { Button } from '@/components/ui/button';

export function AdminProductCreatePage() {
  return (
    <AdminPage
      action={
        <Button
          render={<Link to='/admin/produtos' />}
          size='sm'
          variant='outline'
        >
          <ChevronLeft aria-hidden='true' />
          Produtos
        </Button>
      }
      description={'Cadastre um equipamento e defina seus dados comerciais.'}
      title={'Novo produto'}
      overlap
    >
      <div className='mt-8 max-w-4xl'>
        <ProductForm />
      </div>
    </AdminPage>
  );
}
