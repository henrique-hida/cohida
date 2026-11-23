import { AdminTextarea } from '@/components/admin/AdminTextarea';
import { AdminInput } from '@/components/admin/AdminInput';
import { Trash2, Upload } from 'lucide-react';
// prettier-ignore
import {
  AdminCategoryMultiSelect,
} from '@/components/admin/AdminCategoryMultiSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { resolveProductImageUrl } from '@/lib/commerceApi';
import type { useProductForm } from './useProductForm';

type Props = { form: ReturnType<typeof useProductForm> };

export function ProductDetailsFields({ form }: Props) {
  const {
    product,
    saving,
    setError,
    objectUrlRef,
    setSelectedImage,
    setLocalImagePreview,
    setImagePreviewError,
    imageInputRef,
    selectedImage,
    imageUrl,
    setImageUrl,
    localImagePreview,
    imagePreviewError,
    imageProcessing,
    categories,
    setSelectedCategories,
    selectedCategories,
    setStatus,
    status,
  } = form;
  return (
    <Card>
      <CardContent className='grid gap-5 md:grid-cols-2'>
        <label>
          Nome
          <AdminInput defaultValue={product?.name} name='name' required />
        </label>
        <label>
          Marca
          <AdminInput defaultValue={product?.brand} name='brand' required />
        </label>
        <label className='md:col-span-2'>
          Descrição
          <AdminTextarea
            defaultValue={product?.description}
            name='description'
            required
          />
        </label>
        <div className='grid gap-2 md:col-span-2'>
          <span className='text-sm font-medium'>Foto do produto</span>
          <input
            accept='image/jpeg,image/png,image/webp'
            aria-label='Selecionar foto do produto'
            className='sr-only'
            disabled={saving}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (!file) return;
              if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
                setError('Envie uma foto PNG, JPEG ou WebP.');
                event.currentTarget.value = '';
                return;
              }
              if (file.size > 8 * 1024 * 1024) {
                setError('A foto deve ter no máximo 8 MB.');
                event.currentTarget.value = '';
                return;
              }
              if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
              }
              const previewUrl = URL.createObjectURL(file);
              objectUrlRef.current = previewUrl;
              setSelectedImage(file);
              setLocalImagePreview(previewUrl);
              setImagePreviewError(false);
              setError('');
              event.currentTarget.value = '';
            }}
            ref={imageInputRef}
            type='file'
          />
          <div className='flex flex-wrap items-center gap-3'>
            <Button
              disabled={saving}
              onClick={() => imageInputRef.current?.click()}
              type='button'
              variant='outline'
            >
              <Upload aria-hidden='true' />
              {selectedImage ? 'Trocar foto' : 'Enviar foto'}
            </Button>
            {selectedImage ? (
              <span
                className={[
                  'max-w-64 truncate text-sm',
                  'text-muted-foreground',
                ].join(' ')}
              >
                {selectedImage.name}
              </span>
            ) : null}
            {selectedImage || imageUrl ? (
              <Button
                aria-label='Remover foto do produto'
                disabled={saving}
                onClick={() => {
                  if (objectUrlRef.current) {
                    URL.revokeObjectURL(objectUrlRef.current);
                    objectUrlRef.current = null;
                  }
                  setSelectedImage(null);
                  setLocalImagePreview('');
                  setImageUrl('');
                  setImagePreviewError(false);
                  if (imageInputRef.current) imageInputRef.current.value = '';
                }}
                size='icon-sm'
                type='button'
                variant='ghost'
              >
                <Trash2 aria-hidden='true' />
              </Button>
            ) : null}
          </div>
          {imageProcessing.checking ||
          imageProcessing.status === 'PROCESSING' ? (
            <p className='text-sm text-muted-foreground'>Processando foto...</p>
          ) : imageProcessing.status === 'FAILED' ? (
            <div className='flex items-center gap-3'>
              <p className='text-sm text-destructive'>
                Não foi possível processar a foto.
              </p>
              <Button
                onClick={() => void imageProcessing.retry()}
                type='button'
                variant='outline'
              >
                Tentar novamente
              </Button>
              {imageProcessing.retryError ? (
                <p role='alert'>{imageProcessing.retryError}</p>
              ) : null}
            </div>
          ) : null}
          {(localImagePreview || imageUrl) &&
          !imageProcessing.checking &&
          imageProcessing.status !== 'PROCESSING' &&
          imageProcessing.status !== 'FAILED' ? (
            imagePreviewError ? (
              <p className='text-sm text-muted-foreground'>
                Não foi possível carregar a prévia desta imagem.
              </p>
            ) : (
              <img
                alt='Prévia da foto do produto'
                className={[
                  'size-32 rounded-lg border border-border',
                  'bg-muted object-contain p-2',
                ].join(' ')}
                onError={() => setImagePreviewError(true)}
                src={
                  localImagePreview ||
                  resolveProductImageUrl(imageUrl) ||
                  undefined
                }
              />
            )
          ) : null}
        </div>
        <div className='grid gap-2 md:col-span-2'>
          <span className='text-sm font-medium'>Categorias</span>
          <AdminCategoryMultiSelect
            ariaLabel='Selecionar categorias do produto'
            categories={categories}
            onValueChange={setSelectedCategories}
            placeholder='Selecione as categorias'
            showSelectedBadges
            values={selectedCategories}
          />
        </div>
        <label>
          Estoque mínimo
          <AdminInput
            defaultValue={product?.attributes.minimumStock ?? 0}
            min='0'
            name='minimumStock'
            type='number'
          />
        </label>
        <label className='grid gap-2 text-sm font-medium'>
          Situação
          <Select
            onValueChange={(value) =>
              setStatus(value === 'inactive' ? 'inactive' : 'active')
            }
            value={status}
          >
            <SelectTrigger
              className={[
                'h-10 w-full bg-background',
                'data-[size=default]:h-10',
              ].join(' ')}
            >
              <SelectValue>
                {status === 'active' ? 'Ativo' : 'Inativo'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='active'>Ativo</SelectItem>
              <SelectItem value='inactive'>Inativo</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </CardContent>
    </Card>
  );
}
