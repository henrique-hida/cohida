import { Link } from 'react-router';
import { ProductCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import type { Product, ProductVariant } from '@/types';

type Props = {
  products: Product[];
  onAddToCart: (product: Product, variant: ProductVariant) => void;
};

export function FeaturedProductsSection({ products, onAddToCart }: Props) {
  return (
    <section className='mt-20'>
      <div className='flex flex-wrap items-end justify-between gap-6'>
        <div>
          <h2 className='text-3xl font-semibold tracking-tight'>
            Produtos em destaque
          </h2>
        </div>
        <Button render={<Link to='/produtos' />} variant='outline'>
          Ver catálogo
        </Button>
      </div>
      <div className='mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
        {products.slice(0, 4).map((product) => (
          <ProductCard
            key={product.id}
            onAddToCart={onAddToCart}
            product={product}
          />
        ))}
      </div>
    </section>
  );
}
