export interface VariantDraft {
  id?: string;
  color: string;
  price: string;
  size: string;
  sku: string;
  stock: string;
}

export function blankVariant(): VariantDraft {
  return { color: '', price: '', size: '', sku: '', stock: '0' };
}

export function variantLabel(variant: Pick<VariantDraft, 'color' | 'size'>) {
  return (
    [variant.color.trim(), variant.size.trim()].filter(Boolean).join(' · ') ||
    'Padrão'
  );
}
