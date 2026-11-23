import { useCommerce } from '@/data/useCommerce';

type CommerceState = ReturnType<typeof useCommerce>['state'];

export function getCartEntries(state: CommerceState) {
  return state.cartItems.flatMap((item) => {
    const product = state.products.find((entry) => entry.id === item.productId);
    const variant = product?.variants.find(
      (entry) => entry.id === item.variantId,
    );
    return product && variant ? [{ item, product, variant }] : [];
  });
}
