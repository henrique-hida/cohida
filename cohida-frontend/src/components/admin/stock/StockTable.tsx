import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';

export type StockRow = {
  currentStock: number;
  minimumStock: number;
  productId: number;
  productName: string;
  sku: string;
  variantId: number;
  variantLabel: string;
};

type Props = {
  rows: StockRow[];
  drafts: Record<number, string>;
  saving: number | null;
  onChange: (row: StockRow, value: string) => void;
  onBlur: (row: StockRow, value: string) => void;
};

export function StockTable({ rows, drafts, saving, onChange, onBlur }: Props) {
  return (
    <Table className='min-w-[48rem] text-left'>
      <thead
        className={[
          'border-b border-border text-xs',
          'tracking-wide text-muted-foreground',
          'uppercase',
        ].join(' ')}
      >
        <tr>
          <th className='pb-3 font-medium'>Produto</th>
          <th className='pb-3 font-medium'>Variação</th>
          <th className='pb-3 font-medium'>SKU</th>
          <th className='pb-3 font-medium'>Situação</th>
          <th className='pb-3 text-right font-medium'>Mínimo</th>
          <th className='pb-3 text-right font-medium'>Saldo</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const lowStock = row.currentStock <= row.minimumStock;
          return (
            <tr
              className='border-b border-border last:border-0'
              key={row.variantId}
            >
              <td className='py-3 font-medium'>{row.productName}</td>
              <td className='py-3'>{row.variantLabel}</td>
              <td className='py-3 text-muted-foreground'>{row.sku}</td>
              <td className='py-3'>
                <Badge variant={lowStock ? 'warning' : 'success'}>
                  {lowStock ? 'NO LIMITE' : 'DISPONÍVEL'}
                </Badge>
              </td>
              <td className='py-3 text-right'>{row.minimumStock} un.</td>
              <td className='py-3 text-right'>
                <input
                  aria-label={[
                    'Saldo de ',
                    String(row.productName),
                    ' ',
                    String(row.variantLabel),
                  ].join('')}
                  className={[
                    'h-9 w-24 rounded-lg border border-input',
                    'bg-background px-2 text-right text-sm',
                    'outline-none focus-visible:ring-3',
                    'focus-visible:ring-ring/50',
                  ].join(' ')}
                  disabled={saving === row.variantId}
                  min='0'
                  onChange={(event) => onChange(row, event.target.value)}
                  onBlur={(event) => onBlur(row, event.target.value)}
                  step='1'
                  type='number'
                  value={drafts[row.variantId] ?? String(row.currentStock)}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
