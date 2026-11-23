import type { DemoCommerceState } from './types';

export function emptyState(): DemoCommerceState {
  return {
    addresses: [],
    adminCustomerActive: {},
    adminOrderStatuses: {},
    buyNowItem: null,
    cards: [],
    cartItems: [],
    coupons: [],
    customer: null,
    exchanges: [],
    expiredCartItems: [],
    orders: [],
    products: [],
    sessionCustomerId: null,
    sessionHydrated: false,
    cartTotals: {
      subtotalCents: 0,
      discountCents: 0,
      shippingCents: 0,
      totalCents: 0,
      couponCode: null,
      couponCodes: [],
    },
  };
}
