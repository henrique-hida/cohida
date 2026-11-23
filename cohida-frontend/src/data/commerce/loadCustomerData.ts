import { commerceApi } from '@/lib/commerceApi';
import { mapCart, mapCoupon, mapOrder, mapReturn } from './mappers';

export async function loadCustomerData() {
  // Loading the cart can expire reservations on the server. Fetch expiration
  // notices afterwards so the UI never renders a cart that was reconciled with
  // a stale list of expired items.
  const cart = await commerceApi.cart();
  const [cards, orders, returns, coupons, expiredCartItems] = await Promise.all(
    [
      commerceApi.cards(),
      commerceApi.orders(),
      commerceApi.returns(),
      commerceApi.customerCoupons(),
      commerceApi.expiredCartItems().catch(() => []),
    ],
  );
  return {
    ...mapCart(cart),
    cards: cards.map((card) => ({
      id: String(card.id),
      brand: card.brand,
      lastDigits: card.lastDigits,
      label: card.label,
      isPreferred: card.preferred,
    })),
    orders: orders.map(mapOrder),
    exchanges: returns.map(mapReturn),
    coupons: coupons.map(mapCoupon),
    expiredCartItems,
  };
}
