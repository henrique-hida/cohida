import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ShoppingCart, Star } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';

import { Price, StoreHeader } from '@/components/shared';
import { PageLayout } from '@/components/shared/PageLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCommerce } from '@/data/useCommerce';
import { useCategories } from '@/data/useCategories';
import {
  commerceApi,
  type ApiProductReview,
  type ApiReviewEligibility,
} from '@/lib/commerceApi';
import { getSessionRole } from '@/lib/customerApi';

export function ProductDetailPage() {
  const { productSlug } = useParams();
  const navigate = useNavigate();
  const { addCartItem, startBuyNow, state } = useCommerce();
  const categories = useCategories();
  const product = state.products.find((item) => item.slug === productSlug);
  const productId = product?.id;
  const reviewsProductSlug = product?.slug;
  const isSignedInCustomer = Boolean(
    state.customer && state.sessionCustomerId === state.customer.id,
  );
  const [selectedVariantId, setSelectedVariantId] = useState(
    product?.variants[0]?.id ?? '',
  );
  const [buyNowError, setBuyNowError] = useState('');
  const [reviews, setReviews] = useState<ApiProductReview[]>([]);
  const [reviewEligibility, setReviewEligibility] =
    useState<ApiReviewEligibility | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewDescription, setReviewDescription] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [searchParams] = useSearchParams();
  const requestedReviewOrderId = searchParams.get('avaliar') ?? undefined;
  const cartItemCount = state.cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );
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

  useEffect(() => {
    if (!productId || !reviewsProductSlug) return;
    let active = true;
    void commerceApi
      .productReviews(reviewsProductSlug)
      .then((items) => {
        if (active) setReviews(items);
      })
      .catch(() => {
        if (active) setReviews([]);
      });
    if (getSessionRole() === 'CUSTOMER') {
      void commerceApi
        .reviewEligibility(productId, requestedReviewOrderId)
        .then((eligibility) => {
          if (active) setReviewEligibility(eligibility);
        })
        .catch(() => {
          if (active) setReviewEligibility(null);
        });
    }
    return () => {
      active = false;
    };
  }, [
    productId,
    reviewsProductSlug,
    requestedReviewOrderId,
    state.sessionCustomerId,
  ]);

  async function submitReview() {
    if (
      !product ||
      !reviewEligibility?.eligible ||
      reviewEligibility.orderId === null
    )
      return;
    setSubmittingReview(true);
    setReviewError('');
    try {
      const created = await commerceApi.createProductReview(product.id, {
        orderId: reviewEligibility.orderId,
        rating: reviewRating,
        description: reviewDescription,
      });
      setReviews((current) => [created, ...current]);
      setReviewEligibility({
        eligible: false,
        alreadyReviewed: true,
        orderId: null,
      });
      setReviewDescription('');
    } catch (reason) {
      setReviewError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível salvar sua avaliação.',
      );
    } finally {
      setSubmittingReview(false);
    }
  }

  const displayedRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : (product?.rating ?? 0);
  const displayedReviewCount = Math.max(
    product?.reviewCount ?? 0,
    reviews.length,
  );

  if (!product) {
    return (
      <div className='min-h-svh bg-background'>
        <StoreHeader />
        <PageLayout
          action={
            <Button render={<Link to='/produtos' />} variant='outline'>
              <ChevronLeft />
              Catálogo
            </Button>
          }
          description='Este item não está disponível no catálogo.'
          title='Produto não encontrado'
        >
          <Card className='mt-8 py-0'>
            <CardContent className='p-5 text-sm text-muted-foreground'>
              <p>Confira outros produtos disponíveis no catálogo.</p>
            </CardContent>
          </Card>
        </PageLayout>
      </div>
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
    <div className='min-h-svh bg-background'>
      <StoreHeader cartItemCount={cartItemCount} />
      <PageLayout
        action={
          <Button render={<Link to='/produtos' />} variant='outline'>
            <ChevronLeft />
            Catálogo
          </Button>
        }
        description={product.description}
        title={product.name}
      >
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
                  {displayedRating.toFixed(1)} · {displayedReviewCount}{' '}
                  avaliações
                </span>
              </div>
              <div className='mt-6'>
                <Price
                  compareAtPriceCents={product.compareAtPriceCents}
                  priceCents={selectedPriceCents}
                />
              </div>
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
                            (currentVariant?.size ?? '') === size
                              ? 'default'
                              : 'outline'
                          }
                        >
                          {size || 'Padrão'}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {!hasColorOptions &&
                !hasSizeOptions &&
                product.variants.length > 1 ? (
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
                            currentVariant?.id === variant.id
                              ? 'default'
                              : 'outline'
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
        <section
          className={[
            'mt-10 grid gap-6',
            'lg:grid-cols-[minmax(0,1fr)_22rem]',
            'lg:items-start',
          ].join(' ')}
          id='avaliacoes'
        >
          <div>
            <div
              className={[
                'flex flex-wrap items-baseline',
                'justify-between gap-2',
              ].join(' ')}
            >
              <h2 className='text-2xl font-semibold tracking-tight'>
                Avaliações dos clientes
              </h2>
              <p className='text-sm text-muted-foreground'>
                {displayedRating.toFixed(1)} de 5 · {displayedReviewCount}{' '}
                avaliações
              </p>
            </div>
            <div className='mt-5 grid gap-4'>
              {reviews.length ? (
                reviews.map((review) => (
                  <Card className='py-0' key={review.id}>
                    <CardContent className='p-5'>
                      <div
                        className={[
                          'flex flex-wrap items-center',
                          'justify-between gap-2',
                        ].join(' ')}
                      >
                        <p className='font-medium'>{review.reviewer}</p>
                        <div className='flex items-center gap-2'>
                          <ReviewStars rating={review.rating} />
                          <span className='text-sm text-muted-foreground'>
                            {review.rating.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <p className='mt-3 whitespace-pre-wrap text-sm leading-6'>
                        {review.description}
                      </p>
                      <p className='mt-3 text-xs text-muted-foreground'>
                        {review.verifiedPurchase
                          ? 'Compra verificada · '
                          : 'Avaliação demonstrativa · '}
                        {new Intl.DateTimeFormat('pt-BR', {
                          dateStyle: 'medium',
                        }).format(new Date(review.createdAt))}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className='py-0'>
                  <CardContent className='p-5 text-sm text-muted-foreground'>
                    Este produto ainda não recebeu avaliações.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          {isSignedInCustomer && reviewEligibility?.eligible ? (
            <Card className='py-0'>
              <CardContent className='p-5'>
                <h3 className='font-semibold'>
                  Conte como foi sua experiência
                </h3>
                <p className='mt-1 text-sm text-muted-foreground'>
                  Sua avaliação ajuda outros clientes a escolher.
                </p>
                <label
                  className='mt-5 block text-sm font-medium'
                  htmlFor='review-rating'
                >
                  Nota
                </label>
                <select
                  className={[
                    'mt-2 h-10 w-full rounded-lg border',
                    'border-input bg-background px-3 text-sm',
                  ].join(' ')}
                  id='review-rating'
                  onChange={(event) =>
                    setReviewRating(Number(event.target.value))
                  }
                  value={reviewRating}
                >
                  {Array.from({ length: 11 }, (_, index) => index / 2).map(
                    (rating) => (
                      <option key={rating} value={rating}>
                        {rating.toLocaleString('pt-BR')} de 5
                      </option>
                    ),
                  )}
                </select>
                <label
                  className='mt-4 block text-sm font-medium'
                  htmlFor='review-description'
                >
                  Descrição
                </label>
                <textarea
                  className={[
                    'mt-2 min-h-28 w-full resize-y rounded-lg',
                    'border border-input bg-background px-3',
                    'py-2 text-sm outline-none',
                    'placeholder:text-muted-foreground',
                    'focus-visible:ring-3',
                    'focus-visible:ring-ring/50',
                  ].join(' ')}
                  id='review-description'
                  maxLength={1000}
                  onChange={(event) => setReviewDescription(event.target.value)}
                  placeholder='O que achou do produto?'
                  value={reviewDescription}
                />
                <p className='mt-1 text-right text-xs text-muted-foreground'>
                  {reviewDescription.length}/1000
                </p>
                {reviewError ? (
                  <p className='mt-3 text-sm text-destructive'>{reviewError}</p>
                ) : null}
                <Button
                  className='mt-4 w-full'
                  disabled={submittingReview || !reviewDescription.trim()}
                  onClick={() => void submitReview()}
                >
                  {submittingReview
                    ? 'Enviando avaliação…'
                    : 'Enviar avaliação'}
                </Button>
              </CardContent>
            </Card>
          ) : isSignedInCustomer && reviewEligibility?.alreadyReviewed ? (
            <p className='text-sm text-muted-foreground'>
              Você já avaliou este produto.
            </p>
          ) : null}
        </section>
      </PageLayout>
    </div>
  );
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span
      aria-label={`${rating.toLocaleString('pt-BR')} de 5 estrelas`}
      className='flex gap-0.5'
      role='img'
    >
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.max(0, Math.min(1, rating - index));
        return (
          <span className='relative inline-flex size-4' key={index}>
            <Star className='absolute inset-0 size-4 fill-muted text-muted' />
            {fill > 0 ? (
              <span
                className='absolute inset-y-0 left-0 overflow-hidden'
                style={{ width: `${fill * 100}%` }}
              >
                <Star className='size-4 min-w-4 fill-primary text-primary' />
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}
