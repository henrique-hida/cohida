import type {
  ApiVariant,
  ApiProduct,
  ApiProductImageUpload,
  ApiProductReview,
  ApiReviewEligibility,
  ApiCategory,
  ApiCart,
  ApiExpiredCartItem,
  ApiOrder,
  ApiCard,
  ApiCoupon,
  ApiCouponUpsertRequest,
  ApiReturn,
  ApiAnalyticsOverview,
  ApiSalesPoint,
  ApiTopProduct,
} from './commerce/types';

export type * from './commerce/types';

import { apiRequest } from './customerApi';

export {
  resolveProductImageUrl,
  toStoredProductImageUrl,
} from './commerce/productImages';

export const commerceApi = {
  categories: () => apiRequest<ApiCategory[]>('/categories'),
  adminCategories: () => apiRequest<ApiCategory[]>('/admin/categories'),
  createCategory: (body: { name: string; description: string }) =>
    apiRequest<ApiCategory>('/admin/categories', {
      body: JSON.stringify(body),
      method: 'POST',
    }),
  updateCategory: (id: number, body: { name: string; description: string }) =>
    apiRequest<ApiCategory>(`/admin/categories/${id}`, {
      body: JSON.stringify(body),
      method: 'PUT',
    }),
  deleteCategory: (id: number) =>
    apiRequest<void>(`/admin/categories/${id}`, {
      method: 'DELETE',
    }),
  products: (search?: string, categoryId?: string) => {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (categoryId) query.set('categoryId', categoryId);
    return apiRequest<ApiProduct[]>(
      `/products${query.size ? `?${query}` : ''}`,
    );
  },
  product: (slug: string) =>
    apiRequest<ApiProduct>(`/products/${encodeURIComponent(slug)}`),
  productsByIds: (ids: string[]) => {
    const query = new URLSearchParams();
    ids.forEach((id) => query.append('ids', id));
    return apiRequest<ApiProduct[]>(`/products/lookup?${query}`);
  },
  productsPage: (page: number, search?: string, categoryId?: string) => {
    const query = new URLSearchParams({ page: String(page), size: '24' });
    if (search) query.set('search', search);
    if (categoryId) query.set('categoryId', categoryId);
    return apiRequest<{
      products: ApiProduct[];
      total: number;
      page: number;
      size: number;
    }>(`/products/search?${query}`);
  },
  productReviews: (slug: string) =>
    apiRequest<ApiProductReview[]>(
      `/products/${encodeURIComponent(slug)}/reviews`,
    ),
  reviewEligibility: (productId: string, orderId?: string) => {
    const query = orderId ? `?orderId=${encodeURIComponent(orderId)}` : '';
    return apiRequest<ApiReviewEligibility>(
      `/customers/me/products/${productId}/review-eligibility${query}`,
    );
  },
  createProductReview: (
    productId: string,
    body: {
      orderId: number;
      rating: number;
      description: string;
    },
  ) =>
    apiRequest<ApiProductReview>(
      `/customers/me/products/${productId}/reviews`,
      {
        body: JSON.stringify(body),
        method: 'POST',
      },
    ),
  adminProducts: () => apiRequest<ApiProduct[]>('/admin/products'),
  imageProcessingStatus: (id: string) =>
    apiRequest<{ status: 'PROCESSING' | 'READY' | 'FAILED' }>(
      `/products/images/jobs/${encodeURIComponent(id)}`,
    ),
  retryImageProcessing: (id: string) =>
    apiRequest<void>(`/products/images/jobs/${encodeURIComponent(id)}/retry`, {
      method: 'POST',
    }),
  uploadProductImage: (file: File) => {
    const body = new FormData();
    body.append('file', file);
    return apiRequest<ApiProductImageUpload>('/products/images', {
      body,
      method: 'POST',
    });
  },
  createProduct: (body: unknown) =>
    apiRequest<ApiProduct>('/admin/products', {
      body: JSON.stringify(body),
      method: 'POST',
    }),
  updateProduct: (id: string, body: unknown) =>
    apiRequest<ApiProduct>(`/admin/products/${id}`, {
      body: JSON.stringify(body),
      method: 'PUT',
    }),
  deactivateProduct: (id: string) =>
    apiRequest<void>(`/admin/products/${id}`, {
      method: 'DELETE',
    }),
  updateStock: (productId: string, variantId: string, stockQuantity: number) =>
    apiRequest<ApiVariant>(
      `/admin/products/${productId}/variants/${variantId}/stock`,
      {
        body: JSON.stringify({ stockQuantity }),
        method: 'PATCH',
      },
    ),
  cart: () => apiRequest<ApiCart>('/customers/me/cart'),
  expiredCartItems: () =>
    apiRequest<ApiExpiredCartItem[]>('/customers/me/cart/expired-items'),
  acknowledgeExpiredCartItem: (id: string) =>
    apiRequest<void>(`/customers/me/cart/expired-items/${id}/acknowledge`, {
      method: 'POST',
    }),
  addCartItem: (variantId: string, quantity: number) =>
    apiRequest<ApiCart>('/customers/me/cart/items', {
      body: JSON.stringify({
        variantId: Number(variantId),
        quantity,
      }),
      method: 'POST',
    }),
  updateCartItem: (itemId: string, quantity: number) =>
    apiRequest<ApiCart>(`/customers/me/cart/items/${itemId}`, {
      body: JSON.stringify({ quantity }),
      method: 'PATCH',
    }),
  removeCartItem: (itemId: string) =>
    apiRequest<void>(`/customers/me/cart/items/${itemId}`, {
      method: 'DELETE',
    }),
  applyCoupon: (code: string) =>
    apiRequest<ApiCart>('/customers/me/cart/coupon', {
      body: JSON.stringify({ code }),
      method: 'POST',
    }),
  removeCoupon: () =>
    apiRequest<ApiCart>('/customers/me/cart/coupon', {
      method: 'DELETE',
    }),
  removeCouponByCode: (code: string) =>
    apiRequest<ApiCart>(
      `/customers/me/cart/coupon/${encodeURIComponent(code)}`,
      {
        method: 'DELETE',
      },
    ),
  cards: () => apiRequest<ApiCard[]>('/customers/me/cards'),
  createCard: (body: unknown) =>
    apiRequest<ApiCard>('/customers/me/cards', {
      body: JSON.stringify(body),
      method: 'POST',
    }),
  updateCard: (id: string, label: string) =>
    apiRequest<ApiCard>(`/customers/me/cards/${id}`, {
      body: JSON.stringify({ label }),
      method: 'PUT',
    }),
  preferCard: (id: string) =>
    apiRequest<ApiCard>(`/customers/me/cards/${id}/preferred`, {
      method: 'PATCH',
    }),
  removeCard: (id: string) =>
    apiRequest<void>(`/customers/me/cards/${id}`, {
      method: 'DELETE',
    }),
  orders: () => apiRequest<ApiOrder[]>('/customers/me/orders'),
  checkout: (
    deliveryAddressId: string,
    payments: Array<{
      paymentCardId: string;
      amountCents: number;
    }>,
    idempotencyKey: string,
    cartSignature: string,
  ) =>
    apiRequest<ApiOrder>('/customers/me/checkout', {
      body: JSON.stringify({
        deliveryAddressId: Number(deliveryAddressId),
        payments: payments.map((payment) => ({
          paymentCardId: Number(payment.paymentCardId),
          amountCents: payment.amountCents,
        })),
        cartSignature,
      }),
      headers: { 'Idempotency-Key': idempotencyKey },
      method: 'POST',
    }),
  cancelOrder: (id: string, reason: string) =>
    apiRequest<ApiOrder>(`/customers/me/orders/${id}/cancel`, {
      body: JSON.stringify({ reason }),
      method: 'POST',
    }),
  confirmReceipt: (id: string) =>
    apiRequest<ApiOrder>(`/customers/me/orders/${id}/confirm-receipt`, {
      method: 'POST',
    }),
  returns: () => apiRequest<ApiReturn[]>('/customers/me/orders/returns'),
  requestReturn: (
    orderId: string,
    orderItemId: string | null,
    reason: string,
  ) =>
    apiRequest<ApiReturn>(`/customers/me/orders/${orderId}/returns`, {
      body: JSON.stringify({
        orderItemId: orderItemId === null ? null : Number(orderItemId),
        reason,
      }),
      method: 'POST',
    }),
  dispatchReturn: (id: string, trackingCode: string) =>
    apiRequest<ApiReturn>(`/customers/me/orders/returns/${id}/dispatch`, {
      body: JSON.stringify({ trackingCode }),
      method: 'POST',
    }),
  adminOrders: () => apiRequest<ApiOrder[]>('/admin/orders'),
  adminReturns: () => apiRequest<ApiReturn[]>('/admin/returns'),
  updateReturnStatus: (
    id: string,
    status: 'TROCA_AUTORIZADA' | 'TROCA_NEGADA' | 'TROCADO',
    restockItems?: boolean,
  ) =>
    apiRequest<ApiReturn>(`/admin/returns/${id}/status`, {
      body: JSON.stringify({ status, restockItems }),
      method: 'PATCH',
    }),
  updateOrderStatus: (id: string, status: string) =>
    apiRequest<ApiOrder>(`/admin/orders/${id}/status`, {
      body: JSON.stringify({ status }),
      method: 'PATCH',
    }),
  dispatchOrder: (id: string, trackingCode: string) =>
    apiRequest<ApiOrder>(`/admin/orders/${id}/dispatch`, {
      body: JSON.stringify({ trackingCode }),
      method: 'POST',
    }),
  coupons: () => apiRequest<ApiCoupon[]>('/admin/coupons'),
  customerCoupons: () => apiRequest<ApiCoupon[]>('/customers/me/coupons'),
  createCoupon: (body: ApiCouponUpsertRequest) =>
    apiRequest<ApiCoupon>('/admin/coupons', {
      body: JSON.stringify(body),
      method: 'POST',
    }),
  updateCoupon: (id: string, body: ApiCouponUpsertRequest) =>
    apiRequest<ApiCoupon>(`/admin/coupons/${id}`, {
      body: JSON.stringify(body),
      method: 'PUT',
    }),
  deactivateCoupon: (id: string) =>
    apiRequest<void>(`/admin/coupons/${id}`, {
      method: 'DELETE',
    }),
  analyticsOverview: (from?: string, to?: string, categories?: string[]) => {
    const query = new URLSearchParams();
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    categories?.forEach((categoryId) => query.append('categoryId', categoryId));
    return apiRequest<ApiAnalyticsOverview>(
      `/admin/analytics/overview?${query}`,
    );
  },
  analyticsSales: (from?: string, to?: string, categories?: string[]) => {
    const query = new URLSearchParams();
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    categories?.forEach((categoryId) => query.append('categoryId', categoryId));
    return apiRequest<ApiSalesPoint[]>(`/admin/analytics/sales?${query}`);
  },
  analyticsTopProducts: (from?: string, to?: string, categories?: string[]) => {
    const query = new URLSearchParams();
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    categories?.forEach((categoryId) => query.append('categoryId', categoryId));
    return apiRequest<ApiTopProduct[]>(
      `/admin/analytics/products/top?${query}`,
    );
  },
};
