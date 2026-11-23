import { Link, useNavigate } from 'react-router';
import { AdminDataState } from '@/components/admin/AdminDataState';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { RowActionsMenu } from '@/components/admin/RowActionsMenu';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import type { CustomerResponse } from '@/lib/customerApi';

type Props = {
  visibleCustomers: CustomerResponse[];
  isLoading: boolean;
  error: string;
  search: string;
  page: number;
  pageSize: number;
  totalElements: number;
  setPage: (page: number) => void;
  loadCustomers: () => Promise<void>;
  deactivate: (id: number) => Promise<void>;
};

export function AdminCustomersResults({
  visibleCustomers,
  isLoading,
  error,
  search,
  page,
  pageSize,
  totalElements,
  setPage,
  loadCustomers,
  deactivate,
}: Props) {
  const navigate = useNavigate();
  return (
    <Card>
      <CardContent>
        {isLoading ? (
          <AdminDataState
            description='Consultando os clientes cadastrados.'
            title='Carregando clientes'
            variant='loading'
          />
        ) : error ? (
          <AdminDataState
            action={
              <Button onClick={() => void loadCustomers()} variant='outline'>
                Tentar novamente
              </Button>
            }
            description={error}
            title='Não foi possível carregar os clientes'
            variant='error'
          />
        ) : (
          <>
            <div className='hidden md:block'>
              <Table className='table-fixed text-left'>
                <thead
                  className={[
                    'border-b border-border text-xs',
                    'tracking-wide text-muted-foreground',
                    'uppercase',
                  ].join(' ')}
                >
                  <tr>
                    {['Cliente', 'Código', 'E-mail', 'Telefone'].map(
                      (column) => (
                        <th
                          className={[
                            'pb-3 font-medium ',
                            String(
                              column === 'E-mail'
                                ? 'pr-6'
                                : column === 'Telefone'
                                  ? 'pl-4'
                                  : '',
                            ),
                          ].join('')}
                          key={column}
                        >
                          {column}
                        </th>
                      ),
                    )}
                    <th className='pb-3 text-right font-medium'>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCustomers.length ? (
                    visibleCustomers.map((customer) => {
                      const detailPath = `/admin/clientes/${customer.id}`;
                      return (
                        <tr
                          aria-label={`Abrir ${customer.name}`}
                          className={[
                            'cursor-pointer border-b border-border',
                            'last:border-0 hover:bg-muted/50',
                            'focus-visible:bg-muted/50',
                          ].join(' ')}
                          key={customer.id}
                          onClick={() => navigate(detailPath)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              navigate(detailPath);
                            }
                          }}
                          role='link'
                          tabIndex={0}
                        >
                          <td className='py-4 font-medium'>{customer.name}</td>
                          <td className='py-4'>{customer.code}</td>
                          <td className='truncate py-4 pr-6'>
                            {customer.email}
                          </td>
                          <td className='py-4 pl-4'>{customer.phone}</td>
                          <td className='py-4 text-right'>
                            <RowActionsMenu
                              editTo={`${detailPath}/editar`}
                              label={customer.name}
                              onDelete={
                                customer.active
                                  ? () => void deactivate(customer.id)
                                  : undefined
                              }
                              viewTo={detailPath}
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className='p-0' colSpan={5}>
                        <AdminDataState
                          description={[
                            'Não encontramos clientes para ',
                            '“',
                            String(search || 'a busca atual'),
                            '”.',
                          ].join('')}
                          title='Nenhum resultado encontrado'
                          variant='empty'
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
            <div className='space-y-3 md:hidden'>
              {visibleCustomers.map((customer) => (
                <Link
                  className={[
                    'block rounded-xl border border-border p-4',
                    'transition-colors hover:bg-muted/50',
                  ].join(' ')}
                  key={customer.id}
                  to={`/admin/clientes/${customer.id}`}
                >
                  <p className='font-medium'>{customer.name}</p>
                  <dl className='mt-3 grid gap-2 text-sm'>
                    <div>
                      <dt className='text-xs text-muted-foreground'>E-mail</dt>
                      <dd>{customer.email}</dd>
                    </div>
                    <div>
                      <dt className='text-xs text-muted-foreground'>
                        Telefone
                      </dt>
                      <dd>{customer.phone}</dd>
                    </div>
                  </dl>
                </Link>
              ))}
              {!visibleCustomers.length ? (
                <AdminDataState
                  description={[
                    'Não encontramos clientes para ',
                    '“',
                    String(search || 'a busca atual'),
                    '”.',
                  ].join('')}
                  title='Nenhum resultado encontrado'
                  variant='empty'
                />
              ) : null}
            </div>
            <AdminPagination
              currentPage={page + 1}
              onPageChange={(nextPage) => setPage(nextPage - 1)}
              pageSize={pageSize}
              totalItems={totalElements}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
