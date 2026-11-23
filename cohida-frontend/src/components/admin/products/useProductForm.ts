import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useCategories } from '@/data/useCategories';
import { useCommerce } from '@/data/useCommerce';
import { commerceApi } from '@/lib/commerceApi';
import { useImageProcessing } from './useImageProcessing';
import type { Product, ProductStatus } from '@/types';
import {
  blankVariant,
  variantLabel,
  type VariantDraft,
} from './productFormUtils';

export function useProductForm(product?: Product) {
  const categories = useCategories();
  const { saveProduct } = useCommerce();
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    product?.categoryIds ?? [],
  );
  const [status, setStatus] = useState<ProductStatus>(
    product?.status === 'inactive' ? 'inactive' : 'active',
  );
  const [variants, setVariants] = useState<VariantDraft[]>(() =>
    product?.variants.length
      ? product.variants.map((variant) => ({
          id: variant.id,
          color: variant.color ?? '',
          price: String((variant.priceCents ?? product.priceCents) / 100),
          size: variant.size ?? '',
          sku: variant.sku,
          stock: String(variant.stockQuantity),
        }))
      : [blankVariant()],
  );
  const [imageUrl, setImageUrl] = useState(product?.images[0]?.src ?? '');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [localImagePreview, setLocalImagePreview] = useState('');
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const imageProcessing = useImageProcessing(imageUrl, selectedImage);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  function updateVariant(
    index: number,
    field: keyof Omit<VariantDraft, 'id'>,
    value: string,
  ) {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant,
      ),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    if (!selectedCategories.length) {
      setError('Selecione ao menos uma categoria.');
      return;
    }

    const skus = variants.map((variant) =>
      variant.sku.trim().toLocaleUpperCase('pt-BR'),
    );
    if (skus.some((sku) => !sku) || new Set(skus).size !== skus.length) {
      setError('Cada variação precisa ter um SKU único.');
      return;
    }

    const optionCombinations = variants.map((variant) =>
      JSON.stringify([
        variant.color.trim().toLocaleLowerCase('pt-BR'),
        variant.size.trim().toLocaleLowerCase('pt-BR'),
      ]),
    );
    if (new Set(optionCombinations).size !== optionCombinations.length) {
      setError('As combinações de cor e tamanho devem ser únicas.');
      return;
    }

    const parsedVariants = variants.map((variant) => ({
      id: variant.id ?? 'new',
      sku: variant.sku.trim(),
      label: variantLabel(variant),
      color: variant.color.trim() || undefined,
      size: variant.size.trim() || undefined,
      priceCents: Math.round(Number(variant.price) * 100),
      stockQuantity: Number(variant.stock),
    }));
    if (
      parsedVariants.some(
        (variant) =>
          !Number.isInteger(variant.priceCents) ||
          variant.priceCents <= 0 ||
          !Number.isInteger(variant.stockQuantity) ||
          variant.stockQuantity < 0,
      )
    ) {
      setError('Informe preço e estoque válidos para todas as variações.');
      return;
    }

    setSaving(true);
    try {
      const savedImageUrl = selectedImage
        ? (await commerceApi.uploadProductImage(selectedImage)).imageUrl
        : imageUrl.trim();
      const next: Product = {
        id: product?.id ?? 'new',
        sku: product?.sku ?? parsedVariants[0].sku,
        slug: product?.slug ?? 'new',
        name: String(form.get('name')),
        brand: String(form.get('brand')),
        description: String(form.get('description')),
        priceCents: Math.min(
          ...parsedVariants.map((variant) => variant.priceCents),
        ),
        status,
        categoryIds: selectedCategories,
        images: savedImageUrl
          ? [
              {
                alt: String(form.get('name')),
                id: `${product?.id ?? 'new'}-main`,
                src: savedImageUrl,
              },
            ]
          : [],
        rating: product?.rating ?? 0,
        reviewCount: product?.reviewCount ?? 0,
        attributes: {
          ...(product?.attributes ?? {}),
          minimumStock: String(form.get('minimumStock') ?? 0),
        },
        createdAt: product?.createdAt ?? new Date().toISOString(),
        variants: parsedVariants,
      };
      await saveProduct(next);
      setSaved(true);
      setTimeout(() => navigate('/admin/produtos'), 500);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível salvar o produto.',
      );
    } finally {
      setSaving(false);
    }
  }

  return {
    product,
    categories,
    selectedCategories,
    setSelectedCategories,
    status,
    setStatus,
    variants,
    setVariants,
    imageUrl,
    setImageUrl,
    selectedImage,
    setSelectedImage,
    localImagePreview,
    setLocalImagePreview,
    imagePreviewError,
    setImagePreviewError,
    imageProcessing,
    saving,
    saved,
    error,
    setError,
    imageInputRef,
    objectUrlRef,
    updateVariant,
    submit,
  };
}
