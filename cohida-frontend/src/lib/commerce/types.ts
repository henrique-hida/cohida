export interface ApiVariant {
  id: number;
  sku: string;
  label: string;
  color: string | null;
  size: string | null;
  priceCents: number;
  stockQuantity: number;
}

export interface ApiProduct {
  id: number;
  code: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  imageUrl: string | null;
  minimumStock: number;
  active: boolean;
  rating: number;
  reviewCount: number;
  categoryIds: number[];
  variants: ApiVariant[];
  createdAt: string;
}

export interface ApiProductImageUpload {
  imageUrl: string;
}

export interface ApiProductReview {
  id: number;
  reviewer: string;
  verifiedPurchase: boolean;
  rating: number;
  description: string;
  createdAt: string;
}

export interface ApiReviewEligibility {
  eligible: boolean;
  alreadyReviewed: boolean;
  orderId: number | null;
}

export interface ApiCategory {
  id: number;
  slug: string;
  name: string;
  description: string;
}

export interface ApiCartItem {
  id: number;
  variantId: number;
  productId: number;
  productName: string;
  sku: string;
  label: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  availableStock: number;
}

export interface ApiCart {
  id: number;
  items: ApiCartItem[];
  couponCode: string | null;
  /** Compatibility during the transition from couponCode to coupons. */
  couponCodes?: string[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
}
export interface ApiExpiredCartItem {
  id: number;
  variantId: number;
  productId: number;
  productName: string;
  label: string;
  quantity: number;
  expiredAt: string;
}

export interface ApiOrder {
  id: number;
  customerId: number;
  customerName: string;
  status: string;
  items: Array<{
    id?: number;
    variantId: number;
    productName: string;
    sku: string;
    variantLabel: string;
    unitPriceCents: number;
    quantity: number;
  }>;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  couponCode: string | null;
  cardBrand: string | null;
  cardLastDigits: string | null;
  payments?: Array<{
    paymentCardId: number;
    brand: string;
    lastDigits: string;
    amountCents: number;
  }>;
  issuedCouponCode: string | null;
  issuedCouponValueCents: number | null;
  deliveryLabel: string;
  deliveryStreet: string;
  deliveryNumber: string;
  deliveryNeighborhood: string;
  deliveryZipCode: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryCountry: string;
  createdAt: string;
  approvedAt?: string | null;
  dispatchedAt?: string | null;
  deliveredAt?: string | null;
}

export interface ApiCard {
  id: number;
  brand: string;
  lastDigits: string;
  label: string;
  expiryMonth: number;
  expiryYear: number;
  preferred: boolean;
}

export interface ApiCoupon {
  id: number;
  code: string;
  description: string | null;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountCents: number | null;
  discountPercentage: number | null;
  maximumDiscountCents: number | null;
  minimumOrderValueCents: number | null;
  validFrom: string | null;
  expiresAt: string | null;
  maximumUses: number | null;
  redeemedCount: number;
  active: boolean;
  currentlyValid: boolean;
  origin?: 'ADMIN' | 'RETURN';
  remainingCreditCents?: number | null;
  createdAt: string;
}

export interface ApiCouponUpsertRequest {
  code: string;
  description: string;
  discountType: 'FIXED_AMOUNT' | 'PERCENTAGE';
  discountCents: number | null;
  discountPercentage: number | null;
  maximumDiscountCents: number | null;
  minimumOrderValueCents: number | null;
  validFrom: string;
  expiresAt: string;
  maximumUses: number | null;
  active: boolean;
}

export interface ApiReturn {
  id: number;
  orderItemId: number | null;
  orderId: number;
  status: string;
  reason: string;
  trackingCode: string | null;
  couponCode: string | null;
}

export interface ApiAnalyticsOverview {
  revenueCents: number;
  orders: number;
  averageTicketCents: number;
  discountsCents: number;
  returns: number;
}

export interface ApiSalesPoint {
  period: string;
  categoryId: number | null;
  revenueCents: number;
  orders: number;
}

export interface ApiTopProduct {
  sku: string;
  productName: string;
  quantity: number;
  revenueCents: number;
}
