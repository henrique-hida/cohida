import type { CartItem, Order, Product } from "@/types";
import type { CustomerResponse as ApiCustomerResponse } from "@/lib/customerApi";
import {
  customerApi,
  logout as clearApiSession,
  updateCurrentAccountName,
} from "@/lib/customerApi";
import {
  commerceApi,
  type ApiCart,
  type ApiCoupon,
  type ApiCouponUpsertRequest,
  type ApiOrder,
  type ApiProduct,
  type ApiReturn,
  type ApiExpiredCartItem,
  resolveProductImageUrl,
  toStoredProductImageUrl,
} from "@/lib/commerceApi";
import { tokenizeCardForProcessor } from "@/lib/paymentTokenization";

export interface DemoAddress {
  city: string;
  country: string;
  id: string;
  label: string;
  neighborhood: string;
  number: string;
  postalCode: string;
  state: string;
  street: string;
  type: "billing" | "delivery";
}
export interface DemoCard {
  brand: string;
  id: string;
  isPreferred: boolean;
  label: string;
  lastDigits: string;
}
export interface DemoCustomer {
  birthDate: string;
  cpf: string;
  email: string;
  id: string;
  name: string;
  passwordHash: string;
  phone: string;
}
export interface DemoCoupon {
  active: boolean;
  code: string;
  createdAt: string;
  id: string;
  kind: "exchange" | "promotional";
  valueCents: number;
}
export interface DemoExchange {
  id: string;
  orderId: string;
  orderItemId: string;
  productName?: string;
  reason: string;
  status:
    "requested" | "authorized" | "sent" | "received" | "completed" | "denied";
  dispatch?: {
    carrier: string;
    notes?: string;
    postedAt: string;
    trackingCode: string;
  };
}

export interface DemoCommerceState {
  addresses: DemoAddress[];
  adminCustomerActive: Record<string, boolean>;
  adminOrderStatuses: Record<string, string>;
  buyNowItem: CartItem | null;
  cards: DemoCard[];
  cartItems: CartItem[];
  coupons: DemoCoupon[];
  customer: DemoCustomer | null;
  exchanges: DemoExchange[];
  expiredCartItems: ApiExpiredCartItem[];
  orders: Order[];
  products: Product[];
  sessionCustomerId: string | null;
  sessionHydrated: boolean;
  cartTotals: {
    subtotalCents: number;
    discountCents: number;
    shippingCents: number;
    totalCents: number;
    couponCode: string | null;
    couponCodes: string[];
  };
}

function emptyState(): DemoCommerceState {
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

function mapProduct(product: ApiProduct): Product {
  const imageUrl = resolveProductImageUrl(product.imageUrl);
  const variantPrices = product.variants.map((variant) => variant.priceCents);
  return {
    id: String(product.id),
    sku: product.code,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    description: product.description,
    priceCents: variantPrices.length ? Math.min(...variantPrices) : 0,
    rating: 0,
    reviewCount: 0,
    status: product.active ? "active" : "inactive",
    categoryIds: product.categories,
    images: imageUrl
      ? [{ alt: product.name, id: `${product.id}-main`, src: imageUrl }]
      : [],
    attributes: {
      marca: product.brand,
      categorias: product.categories.join(", "),
      estoque: `${product.variants.reduce(
        (total, variant) => total + variant.stockQuantity,
        0,
      )} unidades disponíveis`,
    },
    createdAt: product.createdAt,
    variants: product.variants.map((variant) => ({
      id: String(variant.id),
      sku: variant.sku,
      label: variant.label,
      color: variant.color ?? undefined,
      size: variant.size ?? undefined,
      priceCents: variant.priceCents,
      stockQuantity: variant.stockQuantity,
    })),
  };
}

function mapOrder(order: ApiOrder): Order {
  const statuses: Record<string, Order["status"]> = {
    EM_ABERTO: "processing",
    EM_PROCESSAMENTO: "processing",
    APROVADA: "approved",
    REPROVADA: "rejected",
    PAGAMENTO_REALIZADO: "approved",
    EM_TRANSITO: "in_transit",
    ENTREGUE: "delivered",
    CANCELADO: "rejected",
  };
  return {
    id: String(order.id),
    customerId: String(order.customerId),
    status: statuses[order.status] ?? "processing",
    items: order.items.map((item) => ({
      id: String(item.id ?? `${order.id}-${item.variantId}`),
      productId: item.productName,
      variantId: String(item.variantId),
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
    })),
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    createdAt: order.createdAt,
    approvedAt: order.approvedAt ?? undefined,
    dispatchedAt: order.dispatchedAt ?? undefined,
    deliveredAt: order.deliveredAt ?? undefined,
    issuedCoupon:
      order.issuedCouponCode && order.issuedCouponValueCents != null
        ? {
            code: order.issuedCouponCode,
            valueCents: order.issuedCouponValueCents,
          }
        : undefined,
  };
}

function mapCart(cart: ApiCart) {
  return {
    cartItems: cart.items.map((item) => ({
      id: String(item.id),
      productId: String(item.productId),
      variantId: String(item.variantId),
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
    })),
    cartTotals: {
      subtotalCents: cart.subtotalCents,
      discountCents: cart.discountCents,
      shippingCents: cart.shippingCents,
      totalCents: cart.totalCents,
      couponCode: cart.couponCode,
      couponCodes:
        cart.couponCodes ?? (cart.couponCode ? [cart.couponCode] : []),
    },
  };
}

function mapCoupon(coupon: ApiCoupon): DemoCoupon {
  return {
    id: String(coupon.id),
    code: coupon.code,
    active: coupon.active,
    createdAt: coupon.createdAt,
    kind: coupon.origin === "RETURN" ? "exchange" : "promotional",
    valueCents:
      coupon.origin === "RETURN"
        ? (coupon.remainingCreditCents ?? coupon.discountCents ?? 0)
        : (coupon.discountCents ??
          Math.round((coupon.discountPercentage ?? 0) * 100)),
  };
}

function mapReturn(item: ApiReturn): DemoExchange {
  const statuses: Record<string, DemoExchange["status"]> = {
    EM_TROCA: "requested",
    TROCA_AUTORIZADA: "authorized",
    TROCA_NEGADA: "denied",
    TROCADO: "completed",
  };
  return {
    id: String(item.id),
    orderId: String(item.orderId),
    orderItemId: item.orderItemId === null ? "" : String(item.orderItemId),
    reason: item.reason,
    status: statuses[item.status] ?? "requested",
    dispatch: item.trackingCode
      ? { carrier: "", postedAt: "", trackingCode: item.trackingCode }
      : undefined,
  };
}

let state = emptyState();
const listeners = new Set<() => void>();
function save(next: DemoCommerceState) {
  state = next;
  listeners.forEach((listener) => listener());
}
function patch(next: Partial<DemoCommerceState>) {
  save({ ...state, ...next });
}

async function refreshCustomerData() {
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
  patch({
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
  });
}

async function refreshProducts(admin = false) {
  patch({
    products: (
      await (admin ? commerceApi.adminProducts() : commerceApi.products())
    ).map(mapProduct),
  });
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
        passwordHash: "",
      },
      sessionCustomerId: String(customer.id),
      addresses: customer.addresses.map((address) => ({
        ...address,
        id: String(address.id),
        type: address.type === "BILLING" ? "billing" : "delivery",
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
  async loadAdminProducts() {
    await refreshProducts(true);
  },
  async loadCustomerCoupons() {
    patch({ coupons: (await commerceApi.customerCoupons()).map(mapCoupon) });
  },
  logout() {
    clearApiSession();
    save({ ...emptyState(), products: state.products });
  },
  async updateCustomer(
    values: Pick<DemoCustomer, "birthDate" | "email" | "name" | "phone">,
  ) {
    await demoCommerceRepository.startApiSession(
      await customerApi.updateProfile(values),
    );
  },
  async addAddress(address: Omit<DemoAddress, "id">) {
    const saved = await customerApi.addAddress({
      ...address,
      type: address.type === "billing" ? "BILLING" : "DELIVERY",
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
  async updateAddress(id: string, address: Omit<DemoAddress, "id">) {
    const saved = await customerApi.updateAddress(id, {
      ...address,
      type: address.type === "billing" ? "BILLING" : "DELIVERY",
    });
    patch({
      addresses: state.addresses.map((item) =>
        item.id === id ? { ...address, id: String(saved.id) } : item,
      ),
    });
  },
  async addCard(card: Omit<DemoCard, "id" | "lastDigits">, cardNumber: string) {
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
  async updateCard(id: string, values: Pick<DemoCard, "brand" | "label">) {
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
    patch({ coupons: (await commerceApi.coupons()).map(mapCoupon) });
  },
  async toggleCoupon(id: string) {
    await commerceApi.deactivateCoupon(id);
    patch({ coupons: (await commerceApi.coupons()).map(mapCoupon) });
  },
  async loadCoupons() {
    patch({ coupons: (await commerceApi.coupons()).map(mapCoupon) });
  },
  async addCartItem(item: CartItem) {
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
  async createOrder(input: {
    deliveryAddressId: string;
    payments: Array<{ paymentCardId: string; amountCents: number }>;
  }) {
    const order = await commerceApi.checkout(
      input.deliveryAddressId,
      input.payments,
    );
    await refreshCustomerData();
    return mapOrder(order);
  },
  async cancelOrder(id: string) {
    await commerceApi.cancelOrder(id, "Cancelado pelo cliente");
    await refreshCustomerData();
  },
  async confirmReceipt(id: string) {
    await commerceApi.confirmReceipt(id);
    await refreshCustomerData();
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
    dispatch: NonNullable<DemoExchange["dispatch"]>,
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
      categories: product.categoryIds,
      minimumStock: Number(product.attributes.minimumStock ?? 0),
      active: product.status === "active",
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
  async setProductStatus(id: string, status: Product["status"]) {
    if (status === "inactive") await commerceApi.deactivateProduct(id);
    await refreshProducts(true);
  },
  async updateAdminOrderStatus(id: string, status: string) {
    await commerceApi.updateOrderStatus(id, status);
  },
  reset() {
    demoCommerceRepository.logout();
  },
};
