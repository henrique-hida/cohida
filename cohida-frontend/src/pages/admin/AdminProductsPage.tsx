import { AdminPage } from '@/components/admin/AdminPage';
// prettier-ignore
import {
  AdminProductsResults,
} from '@/components/admin/products/AdminProductsResults';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, Plus } from 'lucide-react';
import { Link } from 'react-router';

import { AdminFilterSelect } from '@/components/admin/AdminFilterSelect';
import { AdminListFiltersCard } from '@/components/admin/AdminListFiltersCard';
import { AdminListToolbar } from '@/components/admin/AdminListToolbar';
import { Button } from '@/components/ui/button';
import { useCommerce } from '@/data/useCommerce';
import { useCategories } from '@/data/useCategories';

const pageSize = 10;

export function AdminProductsPage() {
  const { loadAdminProducts, setProductStatus, state } = useCommerce();
  const availableCategories = useCategories();
  const categoryNames = useMemo(
    () =>
      new Map(
        availableCategories.map((category) => [category.id, category.name]),
      ),
    [availableCategories],
  );
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadAdminProducts()
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível carregar os produtos.',
        ),
      )
      .finally(() => setIsLoading(false));
  }, [loadAdminProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');

    return state.products
      .filter((product) => {
        if (!normalizedSearch) return true;
        return [
          product.name,
          product.sku,
          product.brand,
          product.description,
          ...product.categoryIds,
          ...product.categoryIds.map((id) => categoryNames.get(id) ?? id),
        ].some((value) =>
          value.toLocaleLowerCase('pt-BR').includes(normalizedSearch),
        );
      })
      .filter(
        (product) =>
          !statusFilter ||
          (statusFilter === 'ATIVO' && product.status === 'active') ||
          (statusFilter === 'INATIVO' && product.status === 'inactive'),
      )
      .filter(
        (product) =>
          !categoryFilter || product.categoryIds.includes(categoryFilter),
      )
      .sort((first, second) => {
        const result = first.name.localeCompare(second.name, 'pt-BR');
        return sortDirection === 'asc' ? result : -result;
      });
  }, [
    categoryFilter,
    categoryNames,
    search,
    sortDirection,
    state.products,
    statusFilter,
  ]);

  const categories = useMemo(
    () =>
      [...new Set(state.products.flatMap((product) => product.categoryIds))]
        .filter(Boolean)
        .sort((first, second) =>
          (categoryNames.get(first) ?? first).localeCompare(
            categoryNames.get(second) ?? second,
            'pt-BR',
          ),
        ),
    [categoryNames, state.products],
  );

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleProducts = filteredProducts.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  async function deactivateProduct(id: string) {
    setError('');
    try {
      await setProductStatus(id, 'inactive');
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível desativar o produto.',
      );
    }
  }

  function updateSearch(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  return (
    <AdminPage
      action={
        <Button render={<Link to='/admin/produtos/novo' />}>
          <Plus />
          Novo produto
        </Button>
      }
      description={[
        'Gerencie o catálogo, atributos,',
        'precificação e status dos',
        'equipamentos.',
      ].join(' ')}
      title={'Produtos'}
      overlap
    >
      <div className='mt-8 grid gap-4'>
        <AdminListFiltersCard>
          <AdminListToolbar
            onSearchChange={updateSearch}
            searchLabel='Pesquisar em produtos'
            searchPlaceholder='Nome, marca, SKU ou categoria'
            searchValue={search}
          >
            <Button
              aria-label='Alternar ordem alfabética'
              onClick={() =>
                setSortDirection((direction) =>
                  direction === 'asc' ? 'desc' : 'asc',
                )
              }
              size='icon-lg'
              variant='outline'
            >
              <ArrowDownUp className='text-muted-foreground' />
            </Button>
            <AdminFilterSelect
              ariaLabel='Filtrar produtos por status'
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              options={[
                { label: 'Ativos', value: 'ATIVO' },
                { label: 'Inativos', value: 'INATIVO' },
              ]}
              placeholder='Status'
              value={statusFilter}
            />
            <AdminFilterSelect
              ariaLabel='Filtrar produtos por categoria'
              onValueChange={(value) => {
                setCategoryFilter(value);
                setCurrentPage(1);
              }}
              options={[
                ...categories.map((category) => ({
                  label: categoryNames.get(category) ?? category,
                  value: category,
                })),
              ]}
              placeholder='Categoria'
              value={categoryFilter}
            />
          </AdminListToolbar>
        </AdminListFiltersCard>
        <AdminProductsResults
          visibleProducts={visibleProducts}
          categoryNames={categoryNames}
          error={error}
          isLoading={isLoading}
          search={search}
          safePage={safePage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          totalItems={filteredProducts.length}
          deactivateProduct={deactivateProduct}
        />
      </div>
    </AdminPage>
  );
}
