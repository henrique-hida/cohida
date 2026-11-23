import { AdminPage } from '@/components/admin/AdminPage';
import { StockTable, type StockRow } from '@/components/admin/stock/StockTable';
import { useEffect, useMemo, useRef, useState } from 'react';

import { AdminDataState } from '@/components/admin/AdminDataState';
import { AdminFilterSelect } from '@/components/admin/AdminFilterSelect';
import { AdminListFiltersCard } from '@/components/admin/AdminListFiltersCard';
import { AdminListToolbar } from '@/components/admin/AdminListToolbar';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { Card, CardContent } from '@/components/ui/card';
import { StatusMessage } from '@/components/ui/status-message';
import { commerceApi, type ApiProduct } from '@/lib/commerceApi';

const pageSize = 10;

function productRows(products: ApiProduct[]): StockRow[] {
  return products.flatMap((product) =>
    product.variants.map((variant) => ({
      currentStock: variant.stockQuantity,
      minimumStock: product.minimumStock,
      productId: product.id,
      productName: product.name,
      sku: variant.sku,
      variantId: variant.id,
      variantLabel: variant.label,
    })),
  );
}

export function AdminStockPage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [page, setPage] = useState(1);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const saveTimers = useRef<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    try {
      setProducts(await commerceApi.adminProducts());
      setError('');
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível carregar o estoque.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(
    () => () => {
      Object.values(saveTimers.current).forEach((timer) =>
        window.clearTimeout(timer),
      );
    },
    [],
  );

  const rows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return productRows(products)
      .filter(
        (row) =>
          !term ||
          [row.productName, row.sku, row.variantLabel].some((value) =>
            value.toLocaleLowerCase('pt-BR').includes(term),
          ),
      )
      .filter(
        (row) =>
          !stockFilter ||
          (stockFilter === 'limite' && row.currentStock <= row.minimumStock) ||
          (stockFilter === 'disponivel' && row.currentStock > row.minimumStock),
      );
  }, [products, search, stockFilter]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = rows.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  async function saveStock(row: StockRow, rawValue: string) {
    const quantity = Number(rawValue);
    if (!Number.isInteger(quantity) || quantity < 0) {
      setError('Informe uma quantidade inteira igual ou maior que zero.');
      return;
    }

    setSaving(row.variantId);
    setError('');
    setNotice('');
    try {
      const updated = await commerceApi.updateStock(
        String(row.productId),
        String(row.variantId),
        quantity,
      );
      setProducts((current) =>
        current.map((product) =>
          product.id !== row.productId
            ? product
            : {
                ...product,
                variants: product.variants.map((variant) =>
                  variant.id === updated.id ? updated : variant,
                ),
              },
        ),
      );
      setDrafts((current) => {
        const next = { ...current };
        delete next[row.variantId];
        return next;
      });
      setNotice(`Estoque de ${row.productName} atualizado.`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível atualizar o estoque.',
      );
    } finally {
      setSaving(null);
    }
  }

  function updateStockDraft(row: StockRow, value: string) {
    setDrafts((current) => ({ ...current, [row.variantId]: value }));
    window.clearTimeout(saveTimers.current[row.variantId]);
    if (value && Number.isInteger(Number(value)) && Number(value) >= 0) {
      saveTimers.current[row.variantId] = window.setTimeout(
        () => void saveStock(row, value),
        500,
      );
    }
  }

  function finishStockDraft(row: StockRow, value: string) {
    window.clearTimeout(saveTimers.current[row.variantId]);
    if (!value || !Number.isInteger(Number(value)) || Number(value) < 0) {
      setError('Informe um saldo inteiro igual ou maior que zero.');
    } else if (saving !== row.variantId && Number(value) !== row.currentStock) {
      void saveStock(row, value);
    }
  }

  return (
    <AdminPage
      description={[
        'Consulte a disponibilidade por',
        'produto e atualize as quantidades',
        'em estoque.',
      ].join(' ')}
      title={'Estoque'}
      overlap
    >
      <div className='mt-8 grid gap-4'>
        <AdminListFiltersCard>
          <AdminListToolbar
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchLabel='Pesquisar no estoque'
            searchPlaceholder='Produto, variação ou SKU'
            searchValue={search}
          >
            <AdminFilterSelect
              ariaLabel='Filtrar estoque por disponibilidade'
              onValueChange={(value) => {
                setStockFilter(value);
                setPage(1);
              }}
              options={[
                { label: 'No limite mínimo', value: 'limite' },
                { label: 'Disponíveis', value: 'disponivel' },
              ]}
              placeholder='Disponibilidade'
              value={stockFilter}
            />
          </AdminListToolbar>
        </AdminListFiltersCard>
        <Card>
          <CardContent>
            {error ? (
              <div className='mb-4'>
                <StatusMessage message={error} variant='danger' />
              </div>
            ) : null}
            {notice ? (
              <div className='mb-4'>
                <StatusMessage
                  key={notice}
                  message={notice}
                  onDismiss={() => setNotice('')}
                  variant='success'
                />
              </div>
            ) : null}
            {loading ? (
              <AdminDataState
                description='Consultando as quantidades cadastradas.'
                title='Carregando estoque'
                variant='loading'
              />
            ) : rows.length ? (
              <>
                <StockTable
                  rows={visibleRows}
                  drafts={drafts}
                  saving={saving}
                  onChange={updateStockDraft}
                  onBlur={finishStockDraft}
                />
                <AdminPagination
                  currentPage={safePage}
                  onPageChange={setPage}
                  pageSize={pageSize}
                  totalItems={rows.length}
                />
              </>
            ) : (
              <AdminDataState
                description='A busca não encontrou nenhuma variação cadastrada.'
                title='Nenhum item de estoque'
                variant='empty'
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}
