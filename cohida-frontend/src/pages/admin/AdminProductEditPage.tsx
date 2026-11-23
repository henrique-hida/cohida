import { AdminPage } from '@/components/admin/AdminPage';
import { useEffect } from 'react';
import { useParams } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router';

import { ProductForm } from '@/components/admin/ProductForm';
import { Button } from '@/components/ui/button';
import { useCommerce } from '@/data/useCommerce';

type Product = ReturnType<typeof useCommerce>['state']['products'][number];

function AdminProductEditPageContent({ product }: { product?: Product }) {
  return (
    <>
      {product ? (
        <div className='mt-8 max-w-4xl'>
          <ProductForm product={product} />
        </div>
      ) : (
        <p className='mt-8 text-muted-foreground'>Carregando produto...</p>
      )}
    </>
  );
}

const getPageHeader = ({ product }: { product?: Product }) => ({
  action: product ? (
    <Button
      nativeButton={false}
      render={<Link to={`/admin/produtos/${product.id}`} />}
      size='sm'
      variant='outline'
    >
      <ChevronLeft />
      {product.name}
    </Button>
  ) : null,
  description:
    'Atualize os dados, as variações e a disponibilidade do produto.',
  overlap: true,
  title: 'Editar produto',
});

export function AdminProductEditPage() {
  const { productId } = useParams();
  const { state, loadAdminProducts } = useCommerce();

  useEffect(() => {
    void loadAdminProducts();
  }, [loadAdminProducts]);

  const product = state.products.find((item) => item.id === productId);
  return (
    <AdminPage {...getPageHeader({ product })}>
      <AdminProductEditPageContent product={product} />
    </AdminPage>
  );
}
