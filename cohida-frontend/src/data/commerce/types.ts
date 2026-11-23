import type { CartItem, Order, Product } from '@/types';
import type { ApiExpiredCartItem } from '@/lib/commerceApi';

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
  type: 'billing' | 'delivery';
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
  kind: 'exchange' | 'promotional';
  valueCents: number;
}
export interface DemoExchange {
  id: string;
  orderId: string;
  orderItemId: string;
  productName?: string;
  reason: string;
  status:
    'requested' | 'authorized' | 'sent' | 'received' | 'completed' | 'denied';
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
