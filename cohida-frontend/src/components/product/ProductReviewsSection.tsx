import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { useProductReviews } from './useProductReviews';

type Props = {
  isSignedInCustomer: boolean;
  reviews: ReturnType<typeof useProductReviews>;
};

export function ProductReviewsSection({
  isSignedInCustomer,
  reviews: data,
}: Props) {
  const {
    reviews,
    reviewEligibility,
    reviewRating,
    setReviewRating,
    reviewDescription,
    setReviewDescription,
    reviewError,
    submittingReview,
    submitReview,
    displayedRating,
    displayedReviewCount,
  } = data;
  return (
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
                    {review.verifiedPurchase ? 'Compra verificada · ' : null}
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
            <h3 className='font-semibold'>Conte como foi sua experiência</h3>
            <p className='mt-1 text-sm text-muted-foreground'>
              Sua avaliação ajuda outros clientes a escolher.
            </p>
            <label
              className='mt-5 block text-sm font-medium'
              htmlFor='review-rating'
            >
              Nota
            </label>
            <Select
              value={String(reviewRating)}
              onValueChange={(value) => {
                if (value !== null) setReviewRating(Number(value));
              }}
            >
              <SelectTrigger id='review-rating' className='mt-2 w-full'>
                <SelectValue>
                  {reviewRating.toLocaleString('pt-BR')} de 5
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 11 }, (_, index) => index / 2).map(
                  (rating) => (
                    <SelectItem key={rating} value={String(rating)}>
                      {rating.toLocaleString('pt-BR')} de 5
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
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
              {submittingReview ? 'Enviando avaliação…' : 'Enviar avaliação'}
            </Button>
          </CardContent>
        </Card>
      ) : isSignedInCustomer && reviewEligibility?.alreadyReviewed ? (
        <p className='text-sm text-muted-foreground'>
          Você já avaliou este produto.
        </p>
      ) : null}
    </section>
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
