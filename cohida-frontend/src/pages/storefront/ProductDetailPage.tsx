import { Page } from '@/components/shared/Page';
import { useParams } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ShoppingCart, Star } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { Price } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCommerce } from '@/data/useCommerce';
import { useCategories } from '@/data/useCategories';
// prettier-ignore
import {
  ProductReviewsSection,
} from '@/components/product/ProductReviewsSection';
// prettier-ignore
import {
  ProductVariantSelector,
} from '@/components/product/ProductVariantSelector';
import { useProductReviews } from '@/components/product/useProductReviews';

type Product = ReturnType<typeof useCommerce>['state']['products'][number];

function ProductDetailPageContent({
  product,
}: {
  product: Product | undefined;
}) {
  const navigate = useNavigate();
  const { addCartItem, startBuyNow, state } = useCommerce();
  const categories = useCategories();
  const isSignedInCustomer = Boolean(
    state.customer && state.sessionCustomerId === state.customer.id,
  );
  const [selectedVariantId, setSelectedVariantId] = useState(
    product?.variants[0]?.id ?? '',
  );
  const [buyNowError, setBuyNowError] = useState('');
  const [searchParams] = useSearchParams();
  const requestedReviewOrderId = searchParams.get('avaliar') ?? undefined;
  const reviewState = useProductReviews(
    product,
    state.sessionCustomerId,
    requestedReviewOrderId,
  );
  const { displayedRating, displayedReviewCount } = reviewState;
  const selectedVariant = useMemo(
    () => product?.variants.find((item) => item.id === selectedVariantId),
    [product, selectedVariantId],
  );
  const currentVariant =
    selectedVariant ??
    product?.variants.find((variant) => variant.stockQuantity > 0) ??
    product?.variants[0];
  const selectedPriceCents =
    currentVariant?.priceCents ?? product?.priceCents ?? 0;
  const colorOptions = [
    ...new Set(product?.variants.map((variant) => variant.color ?? '') ?? []),
  ];
  const sizeOptions = [
    ...new Set(product?.variants.map((variant) => variant.size ?? '') ?? []),
  ];
  const hasColorOptions = colorOptions.some(Boolean);
  const hasSizeOptions = sizeOptions.some(Boolean);

  if (!product) {
    return (
      <>
        <Card className='mt-8 py-0'>
          <CardContent className='p-5 text-sm text-muted-foreground'>
            <p>Confira outros produtos disponíveis no catálogo.</p>
          </CardContent>
        </Card>
      </>
    );
  }

  const category = categories.find(
    (item) => item.id === product.categoryIds[0],
  );
  const isAvailable = Boolean(
    currentVariant && currentVariant.stockQuantity > 0,
  );

  function selectOption(axis: 'color' | 'size', value: string) {
    if (!product) return;
    const candidates = product.variants.filter(
      (variant) => (variant[axis] ?? '') === value,
    );
    const otherAxis = axis === 'color' ? 'size' : 'color';
    const currentValue = currentVariant?.[otherAxis] ?? '';
    const sameOtherOption = candidates.filter(
      (variant) => (variant[otherAxis] ?? '') === currentValue,
    );
    const preferred = sameOtherOption.length ? sameOtherOption : candidates;
    const nextVariant =
      preferred.find((variant) => variant.stockQuantity > 0) ??
      candidates.find((variant) => variant.stockQuantity > 0) ??
      preferred[0] ??
      candidates[0];
    if (nextVariant) setSelectedVariantId(nextVariant.id);
  }

  function optionIsAvailable(axis: 'color' | 'size', value: string) {
    if (!product) return false;
    const candidates = product.variants.filter(
      (variant) => (variant[axis] ?? '') === value,
    );
    return candidates.some((variant) => variant.stockQuantity > 0);
  }

  function addSelectedVariant() {
    if (!currentVariant) return;
    addCartItem({
      id: `cart-${crypto.randomUUID()}`,
      productId: product!.id,
      quantity: 1,
      unitPriceCents: selectedPriceCents,
      variantId: currentVariant.id,
    });
  }

  async function buyNow() {
    if (!product || !currentVariant) return;

    setBuyNowError('');
    try {
      await startBuyNow({
        id: `buy-now-${crypto.randomUUID()}`,
        productId: product.id,
        quantity: 1,
        unitPriceCents: selectedPriceCents,
        variantId: currentVariant.id,
      });
      navigate('/checkout');
    } catch (reason) {
      setBuyNowError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível iniciar a compra.',
      );
    }
  }

  return (
    <>
      <div
        className={[
          'mt-8 grid gap-6',
          'lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,.95fr)]',
          'lg:items-start',
        ].join(' ')}
      >
        <Card className='aspect-square overflow-hidden py-0'>
          <div
            className={[
              'grid size-full place-items-center bg-muted',
              'text-8xl font-semibold',
              'text-muted-foreground sm:text-9xl',
            ].join(' ')}
          >
            {product.images[0] ? (
              <img
                alt={product.images[0].alt}
                className='size-full object-cover'
                src={product.images[0].src}
              />
            ) : (
              product.name.slice(0, 1)
            )}
          </div>
        </Card>
        <Card className='py-0'>
          <CardContent className='p-5 sm:p-6'>
            <div className='flex flex-wrap items-center gap-3'>
              <Badge variant='secondary'>{category?.name}</Badge>
              <span
                className={[
                  'flex items-center gap-1 text-sm',
                  'text-muted-foreground',
                ].join(' ')}
              >
                <Star className='size-4 fill-primary text-primary' />
                {displayedRating.toFixed(1)} · {displayedReviewCount} avaliações
              </span>
            </div>
            <div className='mt-6'>
              <Price
                compareAtPriceCents={product.compareAtPriceCents}
                priceCents={selectedPriceCents}
              />
            </div>
            <ProductVariantSelector
              product={product}
              currentVariant={currentVariant}
              colorOptions={colorOptions}
              sizeOptions={sizeOptions}
              hasColorOptions={hasColorOptions}
              hasSizeOptions={hasSizeOptions}
              isAvailable={isAvailable}
              optionIsAvailable={optionIsAvailable}
              selectOption={selectOption}
              setSelectedVariantId={setSelectedVariantId}
            />
            <div className='mt-8 grid gap-2 sm:flex'>
              <Button
                className='w-full sm:w-auto'
                disabled={!isAvailable}
                onClick={addSelectedVariant}
                size='lg'
                variant='outline'
              >
                <ShoppingCart />
                {isAvailable ? 'Adicionar ao carrinho' : 'Indisponível'}
              </Button>
              <Button
                className='w-full sm:w-auto'
                disabled={!isAvailable}
                onClick={() => void buyNow()}
                size='lg'
              >
                Comprar agora
              </Button>
            </div>
            {buyNowError ? (
              <p className='mt-3 text-sm text-destructive'>{buyNowError}</p>
            ) : null}
            <div
              className={[
                'mt-8 grid gap-4 border-t border-border',
                'pt-5 sm:grid-cols-2',
              ].join(' ')}
            >
              {Object.entries(product.attributes).map(([label, value]) => (
                <div key={label}>
                  <p className='text-xs capitalize text-muted-foreground'>
                    {label}
                  </p>
                  <p className='mt-1 text-sm font-medium'>{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <ProductReviewsSection
        isSignedInCustomer={isSignedInCustomer}
        reviews={reviewState}
      />
    </>
  );
}

export function ProductDetailPage() {
  const { productSlug } = useParams();
  const { state, loadProduct } = useCommerce();
  const product = state.products.find((item) => item.slug === productSlug);
  const [missingSlug, setMissingSlug] = useState<string>();
  const loading = !product && !!productSlug && missingSlug !== productSlug;

  useEffect(() => {
    if (productSlug && !product) {
      void loadProduct(productSlug).catch(() => setMissingSlug(productSlug));
    }
  }, [productSlug, product, loadProduct]);

  return (
    <Page
      action={
        <Button
          nativeButton={false}
          render={<Link to='/produtos' />}
          variant='outline'
        >
          <ChevronLeft />
          Catálogo
        </Button>
      }
      description={
        product?.description ??
        (loading ? '' : 'Este item não está disponível no catálogo.')
      }
      overlap
      title={
        product?.name ??
        (loading ? 'Carregando produto...' : 'Produto não encontrado')
      }
    >
      {loading ? null : <ProductDetailPageContent product={product} />}
    </Page>
  );
}
