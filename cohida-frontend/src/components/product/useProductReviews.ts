import { useEffect, useState } from 'react';
import {
  commerceApi,
  type ApiProductReview,
  type ApiReviewEligibility,
} from '@/lib/commerceApi';
import { getSessionRole } from '@/lib/customerApi';
import type { Product } from '@/types';

export function useProductReviews(
  product: Product | undefined,
  sessionCustomerId: string | null,
  requestedReviewOrderId: string | undefined,
) {
  const productId = product?.id;
  const reviewsProductSlug = product?.slug;
  const [reviews, setReviews] = useState<ApiProductReview[]>([]);
  const [reviewEligibility, setReviewEligibility] =
    useState<ApiReviewEligibility | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewDescription, setReviewDescription] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

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
    sessionCustomerId,
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

  return {
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
  };
}
