import { AdminInput } from '@/components/admin/AdminInput';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { blankVariant, variantLabel } from './productFormUtils';
import type { useProductForm } from './useProductForm';

type Props = { form: ReturnType<typeof useProductForm> };

export function ProductVariantsFields({ form }: Props) {
  const { setVariants, variants, updateVariant } = form;
  return (
    <Card>
      <CardHeader
        className={['flex flex-row items-center justify-between', 'gap-3'].join(
          ' ',
        )}
      >
        <CardTitle>Variações</CardTitle>
        <Button
          onClick={() => setVariants((current) => [...current, blankVariant()])}
          size='sm'
          type='button'
          variant='outline'
        >
          <Plus aria-hidden='true' />
          Adicionar variação
        </Button>
      </CardHeader>
      <CardContent className='grid gap-4'>
        {variants.map((variant, index) => (
          <div
            className={[
              'grid gap-4 rounded-xl border border-border',
              'p-4 md:grid-cols-2 xl:grid-cols-3',
            ].join(' ')}
            key={variant.id ?? `nova-${index}`}
          >
            <div
              className={[
                'flex items-center justify-between gap-3',
                'md:col-span-2 xl:col-span-3',
              ].join(' ')}
            >
              <p className='font-medium'>{variantLabel(variant)}</p>
              <Button
                aria-label={`Remover variação ${variantLabel(variant)}`}
                disabled={variants.length === 1}
                onClick={() =>
                  setVariants((current) =>
                    current.filter((_, variantIndex) => variantIndex !== index),
                  )
                }
                size='icon-sm'
                type='button'
                variant='ghost'
              >
                <Trash2 aria-hidden='true' />
              </Button>
            </div>
            <label>
              SKU
              <AdminInput
                onChange={(event) =>
                  updateVariant(index, 'sku', event.target.value)
                }
                required
                value={variant.sku}
              />
            </label>
            <label>
              Cor
              <AdminInput
                onChange={(event) =>
                  updateVariant(index, 'color', event.target.value)
                }
                placeholder='Opcional'
                value={variant.color}
              />
            </label>
            <label>
              Tamanho
              <AdminInput
                onChange={(event) =>
                  updateVariant(index, 'size', event.target.value)
                }
                placeholder='Opcional'
                value={variant.size}
              />
            </label>
            <label>
              Preço (R$)
              <AdminInput
                min='0.01'
                onChange={(event) =>
                  updateVariant(index, 'price', event.target.value)
                }
                required
                step='0.01'
                type='number'
                value={variant.price}
              />
            </label>
            <label>
              Estoque
              <AdminInput
                min='0'
                onChange={(event) =>
                  updateVariant(index, 'stock', event.target.value)
                }
                required
                step='1'
                type='number'
                value={variant.stock}
              />
            </label>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
