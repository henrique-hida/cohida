import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Section } from '@/components/shared';
import { ProductCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import type { Product, ProductVariant } from '@/types';

type Props = {
  products: Product[];
  onAddToCart: (product: Product, variant: ProductVariant) => void;
};

export function RecommendationsSection({ products, onAddToCart }: Props) {
  const carouselRef = useRef<HTMLDivElement>(null);
  function scrollCarousel(direction: -1 | 1) {
    carouselRef.current?.scrollBy({
      behavior: 'smooth',
      left: carouselRef.current.clientWidth * direction * 0.85,
    });
  }
  return (
    <Section
      className='relative z-10 -mt-28 pb-10 sm:-mt-32 sm:pb-16'
      contentClassName='py-0 md:py-0'
      id='destaques'
    >
      <div className='relative'>
        <div
          className={[
            'flex snap-x snap-mandatory gap-5',
            'overflow-x-auto pb-1 scroll-smooth',
            '[scrollbar-width:none]',
            '[&::-webkit-scrollbar]:hidden',
          ].join(' ')}
          ref={carouselRef}
        >
          {products.slice(0, 10).map((product) => (
            <div className='w-72 shrink-0 snap-start sm:w-80' key={product.id}>
              <ProductCard onAddToCart={onAddToCart} product={product} />
            </div>
          ))}
        </div>
        <Button
          aria-label='Ver recomendações anteriores'
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
          aria-label='Ver próximas recomendações'
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
    </Section>
  );
}
