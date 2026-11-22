import { ArrowUpRight, Package } from 'lucide-react';
import { Link } from 'react-router';

import { resolveProductImageUrl } from '@/lib/commerceApi';
import { formatCurrency } from '@/lib/currency';

export interface ChatProduct {
  id: number;
  slug: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  priceCents: number;
}

export function ChatProductCard({
  product,
  onNavigate,
}: {
  product: ChatProduct;
  onNavigate: () => void;
}) {
  const imageUrl = resolveProductImageUrl(product.imageUrl);

  return (
    <Link
      aria-label={`Ver ${product.name}`}
      className={[
        'group flex min-w-0 items-center gap-2.5',
        'rounded-xl border border-border bg-card',
        'p-2 transition-colors hover:border-primary',
        'focus-visible:outline-none',
        'focus-visible:ring-3',
        'focus-visible:ring-ring/50',
      ].join(' ')}
      onClick={onNavigate}
      to={`/produtos/${encodeURIComponent(product.slug)}`}
    >
      {imageUrl ? (
        <img
          alt=''
          className='size-12 shrink-0 rounded-lg bg-muted object-cover'
          src={imageUrl}
        />
      ) : (
        <span
          className={[
            'grid size-12 shrink-0 place-items-center',
            'rounded-lg bg-muted text-muted-foreground',
          ].join(' ')}
        >
          <Package aria-hidden='true' className='size-5' />
        </span>
      )}
      <span className='min-w-0 flex-1'>
        <span className='block truncate text-xs text-muted-foreground'>
          {product.brand}
        </span>
        <span className='block truncate text-sm font-medium'>
          {product.name}
        </span>
        <span className='block text-xs font-semibold text-primary'>
          A partir de {formatCurrency(product.priceCents)}
        </span>
      </span>
      <ArrowUpRight
        aria-hidden='true'
        className={[
          'size-4 shrink-0 text-muted-foreground',
          'group-hover:text-primary',
        ].join(' ')}
      />
    </Link>
  );
}
