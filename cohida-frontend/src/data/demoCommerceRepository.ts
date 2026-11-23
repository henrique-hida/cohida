import { loadCustomerData } from './commerce/loadCustomerData';
import {
  clearCheckoutAttempt,
  readCheckoutAttempt,
  saveCheckoutAttempt,
  type CheckoutInput,
} from './commerce/checkoutAttempt';
import { emptyState } from './commerce/emptyState';
import { mapCart, mapCoupon, mapOrder, mapProduct } from './commerce/mappers';
import type {
  DemoAddress,
  DemoCard,
  DemoCommerceState,
  DemoCustomer,
  DemoExchange,
} from './commerce/types';
export type {
  DemoAddress,
  DemoCard,
  DemoCommerceState,
  DemoCustomer,
  DemoCoupon,
  DemoExchange,
} from './commerce/types';

import type { CartItem, Product } from '@/types';
// prettier-ignore
import type {
  CustomerResponse as ApiCustomerResponse,
} from '@/lib/customerApi';
import {
  ApiError,
  customerApi,
  logout as clearApiSession,
  updateCurrentAccountName,
} from '@/lib/customerApi';
import {
  commerceApi,
  type ApiCouponUpsertRequest,
  toStoredProductImageUrl,
} from '@/lib/commerceApi';
import { tokenizeCardForProcessor } from '@/lib/paymentTokenization';
import { tokenKey } from '@/lib/customer/session';

let state = emptyState();
const listeners = new Set<() => void>();
function save(next: DemoCommerceState) {
  state = next;
  listeners.forEach((listener) => listener());
}
function patch(next: Partial<DemoCommerceState>) {
  save({ ...state, ...next });
}

function mergeProducts(products: Product[]) {
  const byId = new Map(state.products.map((product) => [product.id, product]));
  products.forEach((product) => byId.set(product.id, product));
  patch({ products: [...byId.values()] });
}

async function ensureProducts(ids: string[]) {
  const missing = [...new Set(ids)].filter(
    (id) => !state.products.some((product) => product.id === id),
  );
  for (let index = 0; index < missing.length; index += 100) {
    mergeProducts(
      (await commerceApi.productsByIds(missing.slice(index, index + 100))).map(
        mapProduct,
      ),
    );
  }
}

async function refreshCustomerData() {
  const token = localStorage.getItem(tokenKey);
  const customerData = await loadCustomerData();
  if (!token || localStorage.getItem(tokenKey) !== token) return;
  await ensureProducts(customerData.cartItems.map((item) => item.productId));
  if (localStorage.getItem(tokenKey) === token) patch(customerData);
}

async function refreshProducts(admin = false) {
  if (admin) {
    patch({ products: (await commerceApi.adminProducts()).map(mapProduct) });
  } else {
    mergeProducts((await commerceApi.productsPage(0)).products.map(mapProduct));
  }
}

export const demoCommerceRepository = {
  getSnapshot: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  async startApiSession(customer: ApiCustomerResponse) {
    updateCurrentAccountName(customer.name);
    patch({
      customer: {
        id: String(customer.id),
        name: customer.name,
        email: customer.email,
        cpf: customer.cpf,
        phone: customer.phone,
        birthDate: customer.birthDate,
        passwordHash: '',
      },
      sessionCustomerId: String(customer.id),
      addresses: customer.addresses.map((address) => ({
        ...address,
        id: String(address.id),
        type: address.type === 'BILLING' ? 'billing' : 'delivery',
      })),
    });
    await refreshCustomerData();
  },
  completeSessionHydration() {
    patch({ sessionHydrated: true });
  },
  async loadCatalog() {
    await refreshProducts();
  },
  async loadProduct(slug: string) {
    const product = mapProduct(await commerceApi.product(slug));
    mergeProducts([product]);
    return product;
  },
  async loadAdminProducts() {
    await refreshProducts(true);
  },
  async loadCustomerCoupons() {
    patch({
      coupons: (await commerceApi.customerCoupons()).map(mapCoupon),
    });
  },
  logout() {
    clearApiSession();
    save({ ...emptyState(), products: state.products });
  },
  async updateCustomer(
    values: Pick<DemoCustomer, 'birthDate' | 'email' | 'name' | 'phone'>,
  ) {
    await demoCommerceRepository.startApiSession(
      await customerApi.updateProfile(values),
    );
  },
  async addAddress(address: Omit<DemoAddress, 'id'>) {
    const saved = await customerApi.addAddress({
      ...address,
      type: address.type === 'billing' ? 'BILLING' : 'DELIVERY',
    });
    const created = { ...address, id: String(saved.id) };
    patch({ addresses: [...state.addresses, created] });
    return created;
  },
  async removeAddress(id: string) {
    await customerApi.removeAddress(id);
    patch({
      addresses: state.addresses.filter((address) => address.id !== id),
    });
  },
  async updateAddress(id: string, address: Omit<DemoAddress, 'id'>) {
    const saved = await customerApi.updateAddress(id, {
      ...address,
      type: address.type === 'billing' ? 'BILLING' : 'DELIVERY',
    });
    patch({
      addresses: state.addresses.map((item) =>
        item.id === id ? { ...address, id: String(saved.id) } : item,
      ),
    });
  },
  async addCard(card: Omit<DemoCard, 'id' | 'lastDigits'>, cardNumber: string) {
    const created = await commerceApi.createCard({
      cardNumber,
      label: card.label,
      processorToken: tokenizeCardForProcessor(cardNumber),
      expiryMonth: 1,
      expiryYear: new Date().getFullYear() + 3,
    });
    await refreshCustomerData();
    return created;
  },
  async updateCard(id: string, values: Pick<DemoCard, 'brand' | 'label'>) {
    await commerceApi.updateCard(id, values.label);
    await refreshCustomerData();
  },
  async setPreferredCard(id: string) {
    await commerceApi.preferCard(id);
    await refreshCustomerData();
  },
  async removeCard(id: string) {
    await commerceApi.removeCard(id);
    await refreshCustomerData();
  },
  async createCoupon(input: ApiCouponUpsertRequest) {
    await commerceApi.createCoupon(input);
    patch({
      coupons: (await commerceApi.coupons()).map(mapCoupon),
    });
  },
  async toggleCoupon(id: string) {
    await commerceApi.deactivateCoupon(id);
    patch({
      coupons: (await commerceApi.coupons()).map(mapCoupon),
    });
  },
  async loadCoupons() {
    patch({
      coupons: (await commerceApi.coupons()).map(mapCoupon),
    });
  },
  async addCartItem(item: CartItem) {
    await ensureProducts([item.productId]);
    patch(
      mapCart(await commerceApi.addCartItem(item.variantId, item.quantity)),
    );
  },
  async updateCartItem(item: CartItem) {
    patch(mapCart(await commerceApi.updateCartItem(item.id, item.quantity)));
  },
  async removeCartItem(id: string) {
    await commerceApi.removeCartItem(id);
    await refreshCustomerData();
  },
  async applyCoupon(code: string) {
    patch(mapCart(await commerceApi.applyCoupon(code)));
  },
  async removeCoupon() {
    patch(mapCart(await commerceApi.removeCoupon()));
  },
  async removeCouponByCode(code: string) {
    patch(mapCart(await commerceApi.removeCouponByCode(code)));
  },
  async acknowledgeExpiredCartItem(id: string) {
    await commerceApi.acknowledgeExpiredCartItem(id);
    patch({
      expiredCartItems: state.expiredCartItems.filter(
        (item) => String(item.id) !== id,
      ),
    });
  },
  async startBuyNow(item: CartItem) {
    await demoCommerceRepository.addCartItem(item);
  },
  getPendingCheckout() {
    return state.sessionCustomerId
      ? readCheckoutAttempt(state.sessionCustomerId)
      : null;
  },
  async createOrder(input: CheckoutInput) {
    const customerId = state.sessionCustomerId;
    if (!customerId) throw new Error('Entre em sua conta para continuar.');
    const previous = readCheckoutAttempt(customerId);
    if (previous && JSON.stringify(previous.input) !== JSON.stringify(input))
      throw new Error(
        'Há uma compra pendente de confirmação. Consulte o pedido anterior.',
      );
    const attempt = previous ?? { key: crypto.randomUUID(), input };
    saveCheckoutAttempt(customerId, attempt);
    let order;
    try {
      order = await commerceApi.checkout(
        attempt.input.deliveryAddressId,
        attempt.input.payments,
        attempt.key,
        attempt.input.cartSignature,
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        clearCheckoutAttempt(customerId, attempt.key);
        if (state.sessionCustomerId === customerId) {
          try {
            await refreshCustomerData();
          } catch {
            // Keep the original validation error for the customer.
          }
        }
      }
      throw error;
    }
    clearCheckoutAttempt(customerId, attempt.key);
    if (state.sessionCustomerId === customerId) {
      try {
        await refreshCustomerData();
      } catch {
        // The completed order remains available even if refreshing fails.
      }
    }
    window.dispatchEvent(new Event('cohida:notifications-refresh'));
    return mapOrder(order);
  },
  async cancelOrder(id: string) {
    await commerceApi.cancelOrder(id, 'Cancelado pelo cliente');
    await refreshCustomerData();
  },
  async confirmReceipt(id: string) {
    await commerceApi.confirmReceipt(id);
    await refreshCustomerData();
    window.dispatchEvent(new Event('cohida:notifications-refresh'));
  },
  async requestExchange(input: {
    orderId: string;
    orderItemId: string | null;
    reason: string;
  }) {
    await commerceApi.requestReturn(
      input.orderId,
      input.orderItemId,
      input.reason,
    );
    await refreshCustomerData();
  },
  async dispatchExchange(
    id: string,
    dispatch: NonNullable<DemoExchange['dispatch']>,
  ) {
    await commerceApi.dispatchReturn(id, dispatch.trackingCode);
    await refreshCustomerData();
  },
  async saveProduct(product: Product) {
    const body = {
      name: product.name,
      brand: product.brand,
      description: product.description,
      imageUrl: toStoredProductImageUrl(product.images[0]?.src),
      categoryIds: product.categoryIds.map(Number),
      minimumStock: Number(product.attributes.minimumStock ?? 0),
      active: product.status === 'active',
      variants: product.variants.map((variant) => ({
        sku: variant.sku,
        label: variant.label,
        color: variant.color,
        size: variant.size,
        priceCents: variant.priceCents ?? product.priceCents,
        stockQuantity: variant.stockQuantity,
      })),
    };
    if (Number.isNaN(Number(product.id))) await commerceApi.createProduct(body);
    else await commerceApi.updateProduct(product.id, body);
    await refreshProducts(true);
  },
  async setProductStatus(id: string, status: Product['status']) {
    if (status === 'inactive') await commerceApi.deactivateProduct(id);
    await refreshProducts(true);
  },
  async updateAdminOrderStatus(id: string, status: string) {
    await commerceApi.updateOrderStatus(id, status);
  },
  reset() {
    demoCommerceRepository.logout();
  },
};
