import { useRef } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types';

export function CommunityProductsSection({
  products,
}: {
  products: Product[];
}) {
  const carouselRef = useRef<HTMLDivElement>(null);
  function scrollCarousel(direction: -1 | 1) {
    carouselRef.current?.scrollBy({
      behavior: 'smooth',
      left: carouselRef.current.clientWidth * direction * 0.85,
    });
  }
  return (
    <section className='mt-20'>
      <div className='flex flex-wrap items-end justify-between gap-6'>
        <div>
          <h2 className='text-3xl font-semibold tracking-tight'>
            Os mais escolhidos pela comunidade
          </h2>
        </div>
        <Button render={<Link to='/produtos' />} variant='outline'>
          Ver todos
        </Button>
      </div>
      <div className='relative mt-8'>
        <div
          className={[
            '-mx-3 flex snap-x snap-mandatory',
            'gap-4 overflow-x-auto px-3 py-3',
            'scroll-smooth',
            '[scrollbar-width:none]',
            '[&::-webkit-scrollbar]:hidden',
          ].join(' ')}
          ref={carouselRef}
        >
          {products.slice(1, 7).map((product, index) => (
            <Link
              className={[
                'group flex w-72 shrink-0 snap-start gap-4',
                'rounded-xl border border-border bg-card',
                'p-4 transition-all hover:-translate-y-0.5',
                'hover:border-primary hover:shadow-lg',
              ].join(' ')}
              key={product.id}
              to={`/produtos/${product.slug}`}
            >
              <img
                alt={product.images[0]?.alt}
                className='size-20 rounded-lg object-cover'
                src={product.images[0]?.src}
              />
              <div className='min-w-0'>
                <p className='text-xs font-medium text-primary'>
                  #{index + 1} em alta
                </p>
                <h3 className='mt-1 font-semibold'>{product.name}</h3>
                <p className='mt-2 text-xs text-muted-foreground'>
                  A partir de
                </p>
                <p className='text-sm font-medium'>
                  R${' '}
                  {(product.priceCents / 100).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <Button
          aria-label='Ver produtos anteriores escolhidos pela comunidade'
          className={[
            'absolute top-1/2 left-0 z-10 size-10',
            '-translate-y-1/2 rounded-full',
            'bg-background text-primary shadow-lg',
            'hover:bg-muted sm:-left-6 sm:size-14',
          ].join(' ')}
          onClick={() => scrollCarousel(-1)}
          size='icon'
          variant='outline'
        >
          <ChevronLeft />
        </Button>
        <Button
          aria-label='Ver próximos produtos escolhidos pela comunidade'
          className={[
            'absolute top-1/2 right-0 z-10 size-10',
            '-translate-y-1/2 rounded-full',
            'bg-background text-primary shadow-lg',
            'hover:bg-muted sm:-right-6 sm:size-14',
          ].join(' ')}
          onClick={() => scrollCarousel(1)}
          size='icon'
          variant='outline'
        >
          <ChevronRight />
        </Button>
      </div>
    </section>
  );
}
