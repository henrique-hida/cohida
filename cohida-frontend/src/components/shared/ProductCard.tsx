import { ShoppingCart, Star } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Price } from '@/components/shared/Price';
import type { Product, ProductVariant } from '@/types';

interface ProductCardProps {
  onAddToCart?: (product: Product, variant: ProductVariant) => void;
  product: Product;
}

export function ProductCard({ onAddToCart, product }: ProductCardProps) {
  const firstAvailableVariant = product.variants.find(
    (variant) => variant.stockQuantity > 0,
  );
  const isAvailable = firstAvailableVariant !== undefined;
  const hasVariantPriceRange =
    new Set(
      product.variants.map(
        (variant) => variant.priceCents ?? product.priceCents,
      ),
    ).size > 1;

  return (
    <Card className='h-full gap-4 pb-4 pt-0'>
      <Link
        aria-label={`Ver ${product.name}`}
        className={[
          'block aspect-[4/3] overflow-hidden',
          'bg-muted outline-none focus-visible:ring-3',
          'focus-visible:ring-ring/50',
        ].join(' ')}
        to={`/produtos/${product.slug}`}
      >
        {product.images[0] ? (
          <img
            alt={product.images[0].alt}
            className={[
              'size-full object-cover object-center',
              'transition-transform duration-300',
              'group-hover/card:scale-105',
            ].join(' ')}
            src={product.images[0].src}
          />
        ) : (
          <span
            className={[
              'flex size-full items-center justify-center',
              'text-5xl font-semibold',
              'text-muted-foreground',
            ].join(' ')}
          >
            {product.name.slice(0, 1)}
          </span>
        )}
      </Link>
      <CardHeader className='gap-2 px-4'>
        <CardTitle>
          <Link
            className={[
              'outline-none hover:text-primary',
              'focus-visible:text-primary',
            ].join(' ')}
            to={`/produtos/${product.slug}`}
          >
            {product.name}
          </Link>
        </CardTitle>
        <p className='line-clamp-2 text-sm text-muted-foreground'>
          {product.description}
        </p>
      </CardHeader>
      <CardFooter
        className={[
          'mt-auto items-center justify-between gap-3',
          'border-t-0 bg-transparent px-4 pb-4 pt-0',
        ].join(' ')}
      >
        <div className='flex h-9 min-w-0 flex-col justify-between'>
          <div>
            {hasVariantPriceRange ? (
              <p className='text-xs leading-none text-muted-foreground'>
                A partir de
              </p>
            ) : null}
            <Price
              className={[
                '[&>span:first-child]:text-lg',
                '[&>span:first-child]:leading-5',
              ].join(' ')}
              compareAtPriceCents={product.compareAtPriceCents}
              priceCents={product.priceCents}
            />
          </div>
          <div className='flex items-center gap-1'>
            <div
              aria-label={`Avaliação ${product.rating.toFixed(1)} de 5`}
              className='flex items-center gap-0.5'
              role='img'
            >
              {Array.from({ length: 5 }, (_, index) => {
                const fill = Math.max(0, Math.min(1, product.rating - index));
                return (
                  <span className='relative inline-flex size-3' key={index}>
                    <Star
                      className={[
                        'absolute inset-0 size-3 fill-muted',
                        'text-muted',
                      ].join(' ')}
                    />
                    {fill > 0 ? (
                      <span
                        className='absolute inset-y-0 left-0 overflow-hidden'
                        style={{ width: `${fill * 100}%` }}
                      >
                        <Star
                          className={[
                            'size-3 min-w-3 fill-primary',
                            'text-primary',
                          ].join(' ')}
                        />
                      </span>
                    ) : null}
                  </span>
                );
              })}
            </div>
            <span className='text-xs leading-none text-muted-foreground'>
              ({product.reviewCount})
            </span>
          </div>
        </div>
        <Button
          className='shrink-0'
          disabled={!isAvailable}
          onClick={() =>
            firstAvailableVariant &&
            onAddToCart?.(product, firstAvailableVariant)
          }
        >
          <ShoppingCart aria-hidden='true' />
          {isAvailable ? 'Adicionar' : 'Indisponível'}
        </Button>
      </CardFooter>
    </Card>
  );
}
