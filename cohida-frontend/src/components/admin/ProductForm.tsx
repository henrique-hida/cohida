import { Check, Save } from 'lucide-react';
import { Link } from 'react-router';
import { adminSuccessNoticeClassName } from '@/components/admin/AdminFormField';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types';
import { ProductDetailsFields } from './products/ProductDetailsFields';
import { ProductVariantsFields } from './products/ProductVariantsFields';
import { useProductForm } from './products/useProductForm';

export function ProductForm({ product }: { product?: Product }) {
  const form = useProductForm(product);
  const { saved, error, saving, submit } = form;
  return (
    <form className='space-y-6' onSubmit={(event) => void submit(event)}>
      {saved ? (
        <div className={adminSuccessNoticeClassName}>
          <Check className='size-5' />
          Produto salvo com sucesso.
        </div>
      ) : null}
      {error ? (
        <p className='rounded-lg bg-error p-3 text-sm text-error-foreground'>
          {error}
        </p>
      ) : null}
      <ProductDetailsFields form={form} />
      <ProductVariantsFields form={form} />
      <div className='flex justify-end gap-3'>
        <Button
          render={<Link to='/admin/produtos' />}
          type='button'
          variant='outline'
        >
          Cancelar
        </Button>
        <Button disabled={saving} type='submit'>
          <Save />
          {saving ? 'Salvando…' : 'Salvar produto'}
        </Button>
      </div>
    </form>
  );
}
