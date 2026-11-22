import { Link } from 'react-router';
import { Dumbbell, Footprints, Mountain, Trophy, Medal } from 'lucide-react';
import type { Category } from '@/types';

const featuredCategoryIds = ['5', '1', '2', '4', '3'] as const;

const categoryIcons = {
  '5': Medal,
  '1': Trophy,
  '2': Footprints,
  '4': Mountain,
  '3': Dumbbell,
};

export function CategoriesSection({ categories }: { categories: Category[] }) {
  const featuredCategories = featuredCategoryIds
    .map((id) => categories.find((category) => category.id === id))
    .filter((category): category is Category => category !== undefined);

  return (
    <section id='categorias'>
      <div className='flex items-end justify-between gap-6'>
        <div>
          <h2 className='text-3xl font-semibold tracking-tight'>
            Categorias para acompanhar seu ritmo
          </h2>
        </div>
      </div>
      <div className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
        {featuredCategories.map((category) => {
          const Icon = categoryIcons[category.id as keyof typeof categoryIcons];

          return (
            <Link
              className={[
                'group rounded-xl border border-border',
                'bg-card p-5 transition-all',
                'hover:-translate-y-0.5',
                'hover:border-primary hover:shadow-lg',
              ].join(' ')}
              key={category.id}
              to={`/produtos?categoria=${category.slug}`}
            >
              <span
                className={[
                  'grid size-11 place-items-center rounded-lg',
                  'bg-primary text-primary-foreground',
                ].join(' ')}
              >
                <Icon aria-hidden='true' className='size-5' />
              </span>
              <h3 className='mt-5 font-semibold'>{category.name}</h3>
              <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                {category.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
