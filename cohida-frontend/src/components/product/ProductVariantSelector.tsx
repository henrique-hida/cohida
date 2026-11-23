import { Button } from '@/components/ui/button';
import type { Product, ProductVariant } from '@/types';

type Props = {
  product: Product;
  currentVariant: ProductVariant | undefined;
  colorOptions: string[];
  sizeOptions: string[];
  hasColorOptions: boolean;
  hasSizeOptions: boolean;
  isAvailable: boolean;
  optionIsAvailable: (axis: 'color' | 'size', value: string) => boolean;
  selectOption: (axis: 'color' | 'size', value: string) => void;
  setSelectedVariantId: (id: string) => void;
};

export function ProductVariantSelector({
  product,
  currentVariant,
  colorOptions,
  sizeOptions,
  hasColorOptions,
  hasSizeOptions,
  isAvailable,
  optionIsAvailable,
  selectOption,
  setSelectedVariantId,
}: Props) {
  return (
    <div className='mt-8 space-y-5'>
      {hasColorOptions ? (
        <div>
          <p className='text-sm font-medium'>Cor</p>
          <div className='mt-3 flex flex-wrap gap-2'>
            {colorOptions.map((color) => (
              <Button
                aria-pressed={(currentVariant?.color ?? '') === color}
                disabled={!optionIsAvailable('color', color)}
                key={color || 'sem-cor'}
                onClick={() => selectOption('color', color)}
                variant={
                  (currentVariant?.color ?? '') === color
                    ? 'default'
                    : 'outline'
                }
              >
                {color || 'Padrão'}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      {hasSizeOptions ? (
        <div>
          <p className='text-sm font-medium'>Tamanho</p>
          <div className='mt-3 flex flex-wrap gap-2'>
            {sizeOptions.map((size) => (
              <Button
                aria-pressed={(currentVariant?.size ?? '') === size}
                disabled={!optionIsAvailable('size', size)}
                key={size || 'sem-tamanho'}
                onClick={() => selectOption('size', size)}
                variant={
                  (currentVariant?.size ?? '') === size ? 'default' : 'outline'
                }
              >
                {size || 'Padrão'}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      {!hasColorOptions && !hasSizeOptions && product.variants.length > 1 ? (
        <div>
          <p className='text-sm font-medium'>Variação</p>
          <div className='mt-3 flex flex-wrap gap-2'>
            {product.variants.map((variant) => (
              <Button
                aria-pressed={currentVariant?.id === variant.id}
                disabled={variant.stockQuantity <= 0}
                key={variant.id}
                onClick={() => setSelectedVariantId(variant.id)}
                variant={
                  currentVariant?.id === variant.id ? 'default' : 'outline'
                }
              >
                {variant.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      <p className='mt-3 text-sm text-muted-foreground'>
        {isAvailable
          ? `${currentVariant?.stockQuantity} unidades disponíveis`
          : 'Variação indisponível'}
      </p>
    </div>
  );
}
