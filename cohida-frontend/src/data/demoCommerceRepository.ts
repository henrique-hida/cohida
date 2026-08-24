import {
  cartDemoItems,
  checkoutAddresses,
  customerCards,
  customerOrders,
  customerProfile,
  exchangeRequests,
} from "@/mocks";
import { adminOrders, type AdminOrderStatus } from "@/mocks/admin";
import type { ExchangeRequest } from "@/mocks/commerce";
import type { CartItem, Order } from "@/types";

const storageKey = "cohida-demo-commerce-v1";

export interface DemoAddress {
  city: string;
  country: string;
  id: string;
  label: string;
  neighborhood: string;
  notes?: string;
  number: string;
  postalCode: string;
  residenceType: string;
  state: string;
  street: string;
  streetType: string;
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
  gender: string;
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

export interface DemoExchange extends ExchangeRequest {
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
  adminOrderStatuses: Record<string, AdminOrderStatus>;
  buyNowItem: CartItem | null;
  cards: DemoCard[];
  cartItems: CartItem[];
  coupons: DemoCoupon[];
  customer: DemoCustomer | null;
  exchanges: DemoExchange[];
  orders: Order[];
  sessionCustomerId: string | null;
}

export interface RegisterCustomerInput {
  billingAddress: Omit<DemoAddress, "id" | "type">;
  birthDate: string;
  cpf: string;
  deliveryAddress: Omit<DemoAddress, "id" | "type">;
  email: string;
  gender: string;
  name: string;
  password: string;
  phone: string;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

async function hashPassword(password: string) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function createInitialState(): DemoCommerceState {
  return {
    addresses: checkoutAddresses.map((address, index) => ({
      city: address.city,
      country: "Brasil",
      id: address.id,
      label: address.label,
      neighborhood: address.neighborhood,
      notes: address.complement,
      number: address.number,
      postalCode: index === 0 ? "04118-010" : "",
      residenceType: "Casa",
      state: address.state,
      street: address.street,
      streetType: "Logradouro",
      type: index === 0 ? "billing" : "delivery",
    })),
    adminCustomerActive: {},
    adminOrderStatuses: Object.fromEntries(
      adminOrders.map((order) => [order.id, order.status]),
    ),
    cards: clone(customerCards),
    buyNowItem: null,
    cartItems: clone(cartDemoItems),
    coupons: [
      {
        active: true,
        code: "COHIDA15",
        createdAt: "2026-08-01T12:00:00.000Z",
        id: "coupon-cohida15",
        kind: "promotional",
        valueCents: 1500,
      },
      {
        active: true,
        code: "TROCA-2500",
        createdAt: "2026-08-10T12:00:00.000Z",
        id: "coupon-exchange",
        kind: "exchange",
        valueCents: 2500,
      },
    ],
    customer: null,
    exchanges: clone(exchangeRequests),
    orders: clone(customerOrders),
    sessionCustomerId: null,
  };
}

function createEmptyState(): DemoCommerceState {
  return {
    addresses: [],
    adminCustomerActive: {},
    adminOrderStatuses: Object.fromEntries(
      adminOrders.map((order) => [order.id, order.status]),
    ),
    cards: [],
    buyNowItem: null,
    cartItems: [],
    coupons: [],
    customer: null,
    exchanges: [],
    orders: [],
    sessionCustomerId: null,
  };
}

function readState() {
  if (typeof window === "undefined") return createEmptyState();
  const stored = window.localStorage.getItem(storageKey);
  if (!stored) return createEmptyState();
  try {
    return {
      ...createEmptyState(),
      ...JSON.parse(stored),
    } as DemoCommerceState;
  } catch {
    return createEmptyState();
  }
}

let state = readState();
const listeners = new Set<() => void>();

function save(nextState: DemoCommerceState) {
  state = nextState;
  window.localStorage.setItem(storageKey, JSON.stringify(state));
  listeners.forEach((listener) => listener());
}

/**
 * Temporary browser-only repository. Replace this module's implementation with
 * API calls later; components consume only the provider/actions interface.
 * It is not a security boundary and must never be used for production auth.
 */
export const demoCommerceRepository = {
  getSnapshot: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  async register(input: RegisterCustomerInput) {
    if (state.customer?.email.toLowerCase() === input.email.toLowerCase()) {
      throw new Error("Já existe uma conta cadastrada com este e-mail.");
    }
    const customer: DemoCustomer = {
      birthDate: input.birthDate,
      cpf: input.cpf,
      email: input.email.trim().toLowerCase(),
      gender: input.gender,
      id: id("customer"),
      name: input.name.trim(),
      passwordHash: await hashPassword(input.password),
      phone: input.phone,
    };
    save({
      ...state,
      addresses: [
        { ...input.billingAddress, id: id("address"), type: "billing" },
        { ...input.deliveryAddress, id: id("address"), type: "delivery" },
      ],
      customer,
      sessionCustomerId: customer.id,
    });
  },
  async login(email: string, password: string) {
    if (
      !state.customer ||
      state.customer.email !== email.trim().toLowerCase()
    ) {
      throw new Error("E-mail ou senha inválidos.");
    }
    if ((await hashPassword(password)) !== state.customer.passwordHash) {
      throw new Error("E-mail ou senha inválidos.");
    }
    save({ ...state, sessionCustomerId: state.customer.id });
  },
  logout() {
    save({ ...state, sessionCustomerId: null });
  },
  async addDemo() {
    const demo = createInitialState();
    const customer: DemoCustomer = {
      birthDate: customerProfile.birthDate,
      cpf: "123.456.789-09",
      email: customerProfile.email,
      gender: "",
      id: "customer-henrique",
      name: customerProfile.name,
      passwordHash: await hashPassword("Demo@123"),
      phone: customerProfile.phone,
    };
    save({ ...demo, customer, sessionCustomerId: customer.id });
  },
  updateCustomer(
    values: Pick<DemoCustomer, "birthDate" | "email" | "name" | "phone">,
  ) {
    if (!state.customer) return;
    save({ ...state, customer: { ...state.customer, ...values } });
  },
  addAddress(address: Omit<DemoAddress, "id">) {
    const createdAddress = { ...address, id: id("address") };
    save({
      ...state,
      addresses: [...state.addresses, createdAddress],
    });
    return createdAddress;
  },
  addCard(card: Omit<DemoCard, "id" | "lastDigits">, cardNumber: string) {
    const digits = cardNumber.replace(/\D/g, "");
    save({
      ...state,
      cards: [
        ...state.cards,
        { ...card, id: id("card"), lastDigits: digits.slice(-4) },
      ],
    });
  },
  updateCard(id: string, values: Pick<DemoCard, "brand" | "label">) {
    save({
      ...state,
      cards: state.cards.map((card) =>
        card.id === id ? { ...card, ...values } : card,
      ),
    });
  },
  setPreferredCard(id: string) {
    if (!state.cards.some((card) => card.id === id)) return;
    save({
      ...state,
      cards: state.cards.map((card) => ({
        ...card,
        isPreferred: card.id === id,
      })),
    });
  },
  removeCard(id: string) {
    const remaining = state.cards.filter((card) => card.id !== id);
    save({
      ...state,
      cards: remaining.map((card, index) => ({
        ...card,
        isPreferred:
          card.isPreferred ||
          (index === 0 && !remaining.some((entry) => entry.isPreferred)),
      })),
    });
  },
  createCoupon(input: Pick<DemoCoupon, "code" | "kind" | "valueCents">) {
    const code = input.code.trim().toUpperCase();
    if (!code) throw new Error("Informe o código do cupom.");
    if (state.coupons.some((coupon) => coupon.code === code))
      throw new Error("Este código de cupom já existe.");
    save({
      ...state,
      coupons: [
        ...state.coupons,
        {
          ...input,
          active: true,
          code,
          createdAt: new Date().toISOString(),
          id: id("coupon"),
        },
      ],
    });
  },
  toggleCoupon(id: string) {
    save({
      ...state,
      coupons: state.coupons.map((coupon) =>
        coupon.id === id ? { ...coupon, active: !coupon.active } : coupon,
      ),
    });
  },
  updateCartItem(item: CartItem) {
    save({
      ...state,
      cartItems: state.cartItems.map((current) =>
        current.id === item.id ? item : current,
      ),
    });
  },
  removeCartItem(itemId: string) {
    save({
      ...state,
      cartItems: state.cartItems.filter((item) => item.id !== itemId),
    });
  },
  addCartItem(item: CartItem) {
    const existing = state.cartItems.find(
      (current) =>
        current.productId === item.productId &&
        current.variantId === item.variantId,
    );
    save({
      ...state,
      cartItems: existing
        ? state.cartItems.map((current) =>
            current.id === existing.id
              ? { ...current, quantity: current.quantity + item.quantity }
              : current,
          )
        : [...state.cartItems, item],
    });
  },
  startBuyNow(item: CartItem) {
    save({ ...state, buyNowItem: item });
  },
  createOrder(
    input: Pick<
      Order,
      | "discountCents"
      | "items"
      | "shippingCents"
      | "subtotalCents"
      | "totalCents"
    >,
    fromBuyNow = false,
  ) {
    if (!state.customer || !state.sessionCustomerId)
      throw new Error("Entre em sua conta para finalizar o pedido.");
    const order: Order = {
      ...input,
      createdAt: new Date().toISOString(),
      customerId: state.customer.id,
      id: `CH-${new Date().getFullYear()}-${String(state.orders.length + 841).padStart(4, "0")}`,
      status: "processing",
    };
    save({
      ...state,
      buyNowItem: fromBuyNow ? null : state.buyNowItem,
      cartItems: fromBuyNow ? state.cartItems : [],
      orders: [order, ...state.orders],
    });
    return order;
  },
  cancelOrder(orderId: string) {
    save({
      ...state,
      orders: state.orders.map((order) =>
        order.id === orderId && order.status === "processing"
          ? { ...order, status: "rejected" }
          : order,
      ),
    });
  },
  confirmReceipt(orderId: string) {
    save({
      ...state,
      orders: state.orders.map((order) =>
        order.id === orderId && order.status === "in_transit"
          ? { ...order, status: "delivered" }
          : order,
      ),
    });
  },
  requestExchange(input: {
    orderId: string;
    productId: string;
    reason: string;
  }) {
    const request = {
      ...input,
      id: `EX-${new Date().getFullYear()}-${String(state.exchanges.length + 17).padStart(3, "0")}`,
      requestedAt: new Date().toISOString(),
      status: "requested" as const,
    };
    save({ ...state, exchanges: [request, ...state.exchanges] });
  },
  dispatchExchange(
    exchangeId: string,
    dispatch: NonNullable<DemoExchange["dispatch"]>,
  ) {
    save({
      ...state,
      exchanges: state.exchanges.map((exchange) =>
        exchange.id === exchangeId && exchange.status === "authorized"
          ? { ...exchange, dispatch, status: "sent" as const }
          : exchange,
      ),
    });
  },
  updateAdminOrderStatus(id: string, status: AdminOrderStatus) {
    save({
      ...state,
      adminOrderStatuses: { ...state.adminOrderStatuses, [id]: status },
    });
  },
  toggleAdminCustomer(id: string) {
    save({
      ...state,
      adminCustomerActive: {
        ...state.adminCustomerActive,
        [id]: !(state.adminCustomerActive[id] ?? true),
      },
    });
  },
  reset() {
    window.localStorage.removeItem(storageKey);
    save(createEmptyState());
  },
};
