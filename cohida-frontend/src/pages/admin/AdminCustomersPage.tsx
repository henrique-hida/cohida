import { AdminPage } from '@/components/admin/AdminPage';
// prettier-ignore
import {
  AdminCustomersResults,
} from '@/components/admin/customers/AdminCustomersResults';
import { ArrowDownUp, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';

import { AdminFilterSelect } from '@/components/admin/AdminFilterSelect';
import { AdminListFiltersCard } from '@/components/admin/AdminListFiltersCard';
import { AdminListToolbar } from '@/components/admin/AdminListToolbar';
import { Button } from '@/components/ui/button';
import { customerApi, type CustomerResponse } from '@/lib/customerApi';

const pageSize = 10;

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await customerApi.list(
        search,
        page,
        pageSize,
        statusFilter || 'ALL',
        sortDirection.toUpperCase(),
      );
      setCustomers(result.content);
      setTotalElements(result.totalElements);
      setError('');
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível carregar os clientes.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, search, sortDirection, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCustomers(), 0);
    return () => window.clearTimeout(timer);
  }, [loadCustomers]);

  const visibleCustomers = customers;

  function updateSearch(value: string) {
    setSearch(value);
    setPage(0);
  }

  async function deactivate(id: number) {
    setError('');
    try {
      await customerApi.deactivate(String(id));
      await loadCustomers();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível excluir o cliente.',
      );
    }
  }

  return (
    <AdminPage
      action={
        <Button render={<Link to='/admin/clientes/novo' />}>
          <Plus />
          Novo cliente
        </Button>
      }
      description={[
        'Gerencie os perfis e dados de',
        'contato cadastrados na plataforma.',
      ].join(' ')}
      title={'Clientes'}
      overlap
    >
      <div className='mt-8 grid gap-4'>
        <AdminListFiltersCard>
          <AdminListToolbar
            onSearchChange={updateSearch}
            searchLabel='Pesquisar em clientes'
            searchPlaceholder='Nome, código, e-mail, CPF ou telefone'
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
              ariaLabel='Filtrar clientes por situação'
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(0);
              }}
              options={[
                { label: 'Ativos', value: 'ACTIVE' },
                { label: 'Inativos', value: 'INACTIVE' },
              ]}
              placeholder='Situação'
              value={statusFilter}
            />
          </AdminListToolbar>
        </AdminListFiltersCard>
        <AdminCustomersResults
          visibleCustomers={visibleCustomers}
          isLoading={isLoading}
          error={error}
          search={search}
          page={page}
          pageSize={pageSize}
          totalElements={totalElements}
          setPage={setPage}
          loadCustomers={loadCustomers}
          deactivate={deactivate}
        />
      </div>
    </AdminPage>
  );
}
