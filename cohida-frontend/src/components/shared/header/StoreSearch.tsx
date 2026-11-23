import { Search } from 'lucide-react';
import { FilterSelect } from '@/components/shared/FilterSelect';
import type { Category } from '@/types';

type Props = {
  searchTerm: string;
  categoryId: string;
  categories: Category[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
};

export function StoreSearch({
  searchTerm,
  categoryId,
  categories,
  onSearchChange,
  onCategoryChange,
}: Props) {
  return (
    <div
      className={[
        'flex w-full min-w-0 items-center gap-2',
        'md:w-[26rem] lg:w-[34rem]',
      ].join(' ')}
      role='search'
    >
      <label className='sr-only' htmlFor='store-search'>
        Buscar produtos
      </label>
      <div className='relative min-w-0 flex-1'>
        <Search
          className={[
            'pointer-events-none absolute top-1/2',
            'left-3 size-4 -translate-y-1/2',
            'text-muted-foreground',
          ].join(' ')}
        />
        <input
          className={[
            'h-10 w-full rounded-lg border border-input',
            'bg-background py-2 pr-3 pl-9 text-sm',
            'outline-none focus-visible:ring-3',
            'focus-visible:ring-ring/50',
          ].join(' ')}
          id='store-search'
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder='Buscar produtos'
          value={searchTerm}
        />
      </div>
      <FilterSelect
        ariaLabel='Filtrar produtos por categoria'
        className='min-w-34 shrink-0'
        onValueChange={onCategoryChange}
        options={categories.map((category) => ({
          label: category.name,
          value: category.slug,
        }))}
        placeholder='Categoria'
        value={categoryId}
      />
    </div>
  );
}
