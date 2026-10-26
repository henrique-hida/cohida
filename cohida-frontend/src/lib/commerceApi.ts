import { apiRequest } from "./customerApi";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

function apiOrigin() {
  const origin =
    typeof window === "undefined" ? "http://localhost" : window.location.origin;
  return new URL(apiBaseUrl, origin).origin;
}

export function resolveProductImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) return undefined;
  if (imageUrl.startsWith("/api/products/images/")) {
    return new URL(imageUrl, apiOrigin()).toString();
  }
  return imageUrl;
}

export function toStoredProductImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) return null;
  try {
    const parsed = new URL(
      imageUrl,
      typeof window === "undefined"
        ? "http://localhost"
        : window.location.origin,
    );
    return parsed.origin === apiOrigin() &&
      parsed.pathname.startsWith("/api/products/images/")
      ? parsed.pathname
      : imageUrl;
  } catch {
    return imageUrl;
  }
}

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

export interface ApiProductImageUpload {
  imageUrl: string;
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
  /** Backward-compatible while clients transition from couponCode to coupons. */
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

export interface ApiCouponUpsertRequest {
  code: string;
  description: string;
  discountType: "FIXED_AMOUNT" | "PERCENTAGE";
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
  category: string | null;
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
  uploadProductImage: (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return apiRequest<ApiProductImageUpload>("/products/images", {
      body,
      method: "POST",
    });
  },
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
  expiredCartItems: () =>
    apiRequest<ApiExpiredCartItem[]>("/customers/me/cart/expired-items"),
  acknowledgeExpiredCartItem: (id: string) =>
    apiRequest<void>(`/customers/me/cart/expired-items/${id}/acknowledge`, {
      method: "POST",
    }),
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
  removeCouponByCode: (code: string) =>
    apiRequest<ApiCart>(
      `/customers/me/cart/coupon/${encodeURIComponent(code)}`,
      {
        method: "DELETE",
      },
    ),
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
      method: "POST",
    }),
  dispatchReturn: (id: string, trackingCode: string) =>
    apiRequest<ApiReturn>(`/customers/me/orders/returns/${id}/dispatch`, {
      body: JSON.stringify({ trackingCode }),
      method: "POST",
    }),
  adminOrders: () => apiRequest<ApiOrder[]>("/admin/orders"),
  adminReturns: () => apiRequest<ApiReturn[]>("/admin/returns"),
  updateReturnStatus: (
    id: string,
    status: "TROCA_AUTORIZADA" | "TROCA_NEGADA" | "TROCADO",
    restockItems?: boolean,
  ) =>
    apiRequest<ApiReturn>(`/admin/returns/${id}/status`, {
      body: JSON.stringify({ status, restockItems }),
      method: "PATCH",
    }),
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
  createCoupon: (body: ApiCouponUpsertRequest) =>
    apiRequest<ApiCoupon>("/admin/coupons", {
      body: JSON.stringify(body),
      method: "POST",
    }),
  updateCoupon: (id: string, body: ApiCouponUpsertRequest) =>
    apiRequest<ApiCoupon>(`/admin/coupons/${id}`, {
      body: JSON.stringify(body),
      method: "PUT",
    }),
  deactivateCoupon: (id: string) =>
    apiRequest<void>(`/admin/coupons/${id}`, { method: "DELETE" }),
  analyticsOverview: (from?: string, to?: string, categories?: string[]) => {
    const query = new URLSearchParams();
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    categories?.forEach((category) => query.append("category", category));
    return apiRequest<ApiAnalyticsOverview>(
      `/admin/analytics/overview?${query}`,
    );
  },
  analyticsSales: (from?: string, to?: string, categories?: string[]) => {
    const query = new URLSearchParams({ groupBy: "month" });
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    categories?.forEach((category) => query.append("category", category));
    return apiRequest<ApiSalesPoint[]>(`/admin/analytics/sales?${query}`);
  },
  analyticsTopProducts: (from?: string, to?: string, categories?: string[]) => {
    const query = new URLSearchParams();
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    categories?.forEach((category) => query.append("category", category));
    return apiRequest<ApiTopProduct[]>(
      `/admin/analytics/products/top?${query}`,
    );
  },
};
