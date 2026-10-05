import { apiRequest } from "./customerApi";

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
  categories: string[];
  variants: ApiVariant[];
  createdAt: string;
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
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
}

export interface ApiOrder {
  id: number;
  customerId: number;
  customerName: string;
  status: string;
  items: Array<{
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
  discountType: "FIXED" | "PERCENTAGE";
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
  origin?: "ADMIN" | "RETURN";
  remainingCreditCents?: number | null;
  createdAt: string;
}

export interface ApiReturn {
  id: number;
  orderItemId: number;
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
  revenueCents: number;
  orders: number;
}

export interface ApiTopProduct {
  sku: string;
  productName: string;
  quantity: number;
  revenueCents: number;
}

export const commerceApi = {
  categories: () => apiRequest<ApiCategory[]>("/categories"),
  adminCategories: () => apiRequest<ApiCategory[]>("/admin/categories"),
  createCategory: (body: { name: string; description: string }) =>
    apiRequest<ApiCategory>("/admin/categories", {
      body: JSON.stringify(body),
      method: "POST",
    }),
  updateCategory: (id: number, body: { name: string; description: string }) =>
    apiRequest<ApiCategory>(`/admin/categories/${id}`, {
      body: JSON.stringify(body),
      method: "PUT",
    }),
  deleteCategory: (id: number) =>
    apiRequest<void>(`/admin/categories/${id}`, { method: "DELETE" }),
  products: (search?: string, category?: string) => {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (category) query.set("category", category);
    return apiRequest<ApiProduct[]>(
      `/products${query.size ? `?${query}` : ""}`,
    );
  },
  adminProducts: () => apiRequest<ApiProduct[]>("/admin/products"),
  createProduct: (body: unknown) =>
    apiRequest<ApiProduct>("/admin/products", {
      body: JSON.stringify(body),
      method: "POST",
    }),
  updateProduct: (id: string, body: unknown) =>
    apiRequest<ApiProduct>(`/admin/products/${id}`, {
      body: JSON.stringify(body),
      method: "PUT",
    }),
  deactivateProduct: (id: string) =>
    apiRequest<void>(`/admin/products/${id}`, { method: "DELETE" }),
  updateStock: (productId: string, variantId: string, stockQuantity: number) =>
    apiRequest<ApiVariant>(
      `/admin/products/${productId}/variants/${variantId}/stock`,
      { body: JSON.stringify({ stockQuantity }), method: "PATCH" },
    ),
  cart: () => apiRequest<ApiCart>("/customers/me/cart"),
  addCartItem: (variantId: string, quantity: number) =>
    apiRequest<ApiCart>("/customers/me/cart/items", {
      body: JSON.stringify({ variantId: Number(variantId), quantity }),
      method: "POST",
    }),
  updateCartItem: (itemId: string, quantity: number) =>
    apiRequest<ApiCart>(`/customers/me/cart/items/${itemId}`, {
      body: JSON.stringify({ quantity }),
      method: "PATCH",
    }),
  removeCartItem: (itemId: string) =>
    apiRequest<void>(`/customers/me/cart/items/${itemId}`, {
      method: "DELETE",
    }),
  applyCoupon: (code: string) =>
    apiRequest<ApiCart>("/customers/me/cart/coupon", {
      body: JSON.stringify({ code }),
      method: "POST",
    }),
  removeCoupon: () =>
    apiRequest<ApiCart>("/customers/me/cart/coupon", { method: "DELETE" }),
  cards: () => apiRequest<ApiCard[]>("/customers/me/cards"),
  createCard: (body: unknown) =>
    apiRequest<ApiCard>("/customers/me/cards", {
      body: JSON.stringify(body),
      method: "POST",
    }),
  updateCard: (id: string, label: string) =>
    apiRequest<ApiCard>(`/customers/me/cards/${id}`, {
      body: JSON.stringify({ label }),
      method: "PUT",
    }),
  preferCard: (id: string) =>
    apiRequest<ApiCard>(`/customers/me/cards/${id}/preferred`, {
      method: "PATCH",
    }),
  removeCard: (id: string) =>
    apiRequest<void>(`/customers/me/cards/${id}`, { method: "DELETE" }),
  orders: () => apiRequest<ApiOrder[]>("/customers/me/orders"),
  checkout: (
    deliveryAddressId: string,
    payments: Array<{ paymentCardId: string; amountCents: number }>,
  ) =>
    apiRequest<ApiOrder>("/customers/me/checkout", {
      body: JSON.stringify({
        deliveryAddressId: Number(deliveryAddressId),
        payments: payments.map((payment) => ({
          paymentCardId: Number(payment.paymentCardId),
          amountCents: payment.amountCents,
        })),
      }),
      method: "POST",
    }),
  cancelOrder: (id: string, reason: string) =>
    apiRequest<ApiOrder>(`/customers/me/orders/${id}/cancel`, {
      body: JSON.stringify({ reason }),
      method: "POST",
    }),
  confirmReceipt: (id: string) =>
    apiRequest<ApiOrder>(`/customers/me/orders/${id}/confirm-receipt`, {
      method: "POST",
    }),
  returns: () => apiRequest<ApiReturn[]>("/customers/me/orders/returns"),
  requestReturn: (orderId: string, orderItemId: string, reason: string) =>
    apiRequest<ApiReturn>(`/customers/me/orders/${orderId}/returns`, {
      body: JSON.stringify({ orderItemId: Number(orderItemId), reason }),
      method: "POST",
    }),
  dispatchReturn: (id: string, trackingCode: string) =>
    apiRequest<ApiReturn>(`/customers/me/orders/returns/${id}/dispatch`, {
      body: JSON.stringify({ trackingCode }),
      method: "POST",
    }),
  adminOrders: () => apiRequest<ApiOrder[]>("/admin/orders"),
  adminReturns: () => apiRequest<ApiReturn[]>("/admin/returns"),
  updateOrderStatus: (id: string, status: string) =>
    apiRequest<ApiOrder>(`/admin/orders/${id}/status`, {
      body: JSON.stringify({ status }),
      method: "PATCH",
    }),
  dispatchOrder: (id: string, trackingCode: string) =>
    apiRequest<ApiOrder>(`/admin/orders/${id}/dispatch`, {
      body: JSON.stringify({ trackingCode }),
      method: "POST",
    }),
  coupons: () => apiRequest<ApiCoupon[]>("/admin/coupons"),
  customerCoupons: () => apiRequest<ApiCoupon[]>("/customers/me/coupons"),
  createCoupon: (body: unknown) =>
    apiRequest<ApiCoupon>("/admin/coupons", {
      body: JSON.stringify(body),
      method: "POST",
    }),
  updateCoupon: (id: string, body: unknown) =>
    apiRequest<ApiCoupon>(`/admin/coupons/${id}`, {
      body: JSON.stringify(body),
      method: "PUT",
    }),
  deactivateCoupon: (id: string) =>
    apiRequest<void>(`/admin/coupons/${id}`, { method: "DELETE" }),
  analyticsOverview: (from?: string, to?: string, category?: string) => {
    const query = new URLSearchParams();
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    if (category) query.set("category", category);
    return apiRequest<ApiAnalyticsOverview>(
      `/admin/analytics/overview?${query}`,
    );
  },
  analyticsSales: (from?: string, to?: string, category?: string) => {
    const query = new URLSearchParams({ groupBy: "month" });
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    if (category) query.set("category", category);
    return apiRequest<ApiSalesPoint[]>(`/admin/analytics/sales?${query}`);
  },
  analyticsTopProducts: (from?: string, to?: string, category?: string) => {
    const query = new URLSearchParams();
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    if (category) query.set("category", category);
    return apiRequest<ApiTopProduct[]>(
      `/admin/analytics/products/top?${query}`,
    );
  },
};
