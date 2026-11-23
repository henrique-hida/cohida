import { Link, useNavigate } from 'react-router';
import { AdminDataState } from '@/components/admin/AdminDataState';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { RowActionsMenu } from '@/components/admin/RowActionsMenu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import type { Product } from '@/types';

type Props = {
  visibleProducts: Product[];
  categoryNames: Map<string, string>;
  error: string;
  isLoading: boolean;
  search: string;
  safePage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  totalItems: number;
  deactivateProduct: (id: string) => Promise<void>;
};

function formatPrice(priceCents: number) {
  return (priceCents / 100).toLocaleString('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  });
}

export function AdminProductsResults({
  visibleProducts,
  categoryNames,
  error,
  isLoading,
  search,
  safePage,
  setCurrentPage,
  pageSize,
  totalItems,
  deactivateProduct,
}: Props) {
  const navigate = useNavigate();
  return (
    <Card>
      <CardContent>
        {error ? (
          <p
            className={[
              'mb-4 rounded-lg bg-error p-3 text-sm',
              'text-error-foreground',
            ].join(' ')}
            role='alert'
          >
            {error}
          </p>
        ) : null}
        {isLoading ? (
          <AdminDataState
            description='Consultando o catálogo cadastrado.'
            title='Carregando produtos'
            variant='loading'
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
                    {['Produto', 'Categoria', 'Estoque', 'Preço', 'Status'].map(
                      (column) => (
                        <th
                          className={[
                            'pb-3 font-medium ',
                            String(column === 'Categoria' ? 'pl-6' : ''),
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
                  {visibleProducts.length ? (
                    visibleProducts.map((product) => {
                      const stock = product.variants.reduce(
                        (total, variant) => total + variant.stockQuantity,
                        0,
                      );
                      const price = product.priceCents;
                      const detailPath = `/admin/produtos/${product.id}`;
                      return (
                        <tr
                          aria-label={`Abrir ${product.name}`}
                          className={[
                            'cursor-pointer border-b border-border',
                            'last:border-0 hover:bg-muted/50',
                            'focus-visible:bg-muted/50',
                          ].join(' ')}
                          key={product.id}
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
                          <td className='py-4 pr-6 font-medium'>
                            {product.name}
                          </td>
                          <td className='py-4 pl-6'>
                            {product.categoryIds
                              .map((id) => categoryNames.get(id) ?? id)
                              .join(', ')}
                          </td>
                          <td className='py-4'>{stock} un.</td>
                          <td className='py-4'>{formatPrice(price)}</td>
                          <td className='py-4'>
                            <Badge
                              variant={
                                product.status === 'active'
                                  ? 'success'
                                  : 'outline'
                              }
                            >
                              {product.status === 'active'
                                ? 'ATIVO'
                                : 'INATIVO'}
                            </Badge>
                          </td>
                          <td className='py-4 text-right'>
                            <RowActionsMenu
                              editTo={`${detailPath}/editar`}
                              label={product.name}
                              onDelete={() =>
                                void deactivateProduct(product.id)
                              }
                              viewTo={detailPath}
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className='p-0' colSpan={6}>
                        <AdminDataState
                          description={[
                            'Não encontramos produtos para ',
                            '“',
                            String(search || 'os filtros selecionados'),
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
              {visibleProducts.map((product) => {
                const stock = product.variants.reduce(
                  (total, variant) => total + variant.stockQuantity,
                  0,
                );
                const price = product.priceCents;
                return (
                  <Link
                    className={[
                      'block rounded-xl border border-border p-4',
                      'transition-colors hover:bg-muted/50',
                    ].join(' ')}
                    key={product.id}
                    to={`/admin/produtos/${product.id}`}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <span className='font-medium'>{product.name}</span>
                      <Badge
                        variant={
                          product.status === 'active' ? 'success' : 'outline'
                        }
                      >
                        {product.status === 'active' ? 'ATIVO' : 'INATIVO'}
                      </Badge>
                    </div>
                    <dl
                      className={[
                        'mt-3 grid grid-cols-2 gap-x-4 gap-y-2',
                        'text-sm',
                      ].join(' ')}
                    >
                      <div>
                        <dt className='text-xs text-muted-foreground'>
                          Categoria
                        </dt>
                        <dd>
                          {product.categoryIds
                            .map((id) => categoryNames.get(id) ?? id)
                            .join(', ')}
                        </dd>
                      </div>
                      <div>
                        <dt className='text-xs text-muted-foreground'>
                          Estoque
                        </dt>
                        <dd>{stock} un.</dd>
                      </div>
                      <div>
                        <dt className='text-xs text-muted-foreground'>Preço</dt>
                        <dd>{formatPrice(price)}</dd>
                      </div>
                    </dl>
                  </Link>
                );
              })}
              {!visibleProducts.length ? (
                <AdminDataState
                  description={[
                    'Não encontramos produtos para ',
                    '“',
                    String(search || 'os filtros selecionados'),
                    '”.',
                  ].join('')}
                  title='Nenhum resultado encontrado'
                  variant='empty'
                />
              ) : null}
            </div>
            <AdminPagination
              currentPage={safePage}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              totalItems={totalItems}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
