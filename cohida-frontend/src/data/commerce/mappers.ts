import type { Order, Product } from '@/types';
import {
  resolveProductImageUrl,
  type ApiCart,
  type ApiCoupon,
  type ApiOrder,
  type ApiProduct,
  type ApiReturn,
} from '@/lib/commerceApi';
import type { DemoCoupon, DemoExchange } from './types';

export function mapProduct(product: ApiProduct): Product {
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
    rating: product.rating,
    reviewCount: product.reviewCount,
    status: product.active ? 'active' : 'inactive',
    categoryIds: product.categoryIds.map(String),
    images: imageUrl
      ? [
          {
            alt: product.name,
            id: `${product.id}-main`,
            src: imageUrl,
          },
        ]
      : [],
    attributes: {
      marca: product.brand,
      categorias: product.categoryIds.join(', '),
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

export function mapOrder(order: ApiOrder): Order {
  const statuses: Record<string, Order['status']> = {
    EM_ABERTO: 'processing',
    EM_PROCESSAMENTO: 'processing',
    APROVADA: 'approved',
    REPROVADA: 'rejected',
    PAGAMENTO_REALIZADO: 'approved',
    EM_TRANSITO: 'in_transit',
    ENTREGUE: 'delivered',
    EM_TROCA: 'in_exchange',
    TROCA_AUTORIZADA: 'exchange_authorized',
    TROCADO: 'exchanged',
    CANCELADO: 'rejected',
  };
  return {
    id: String(order.id),
    customerId: String(order.customerId),
    status: statuses[order.status] ?? 'processing',
    items: order.items.map((item) => ({
      id: String(item.id ?? `${order.id}-${item.variantId}`),
      productId: item.productName,
      variantId: String(item.variantId),
      variantLabel: item.variantLabel,
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

export function mapCart(cart: ApiCart) {
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

export function mapCoupon(coupon: ApiCoupon): DemoCoupon {
  return {
    id: String(coupon.id),
    code: coupon.code,
    active: coupon.active,
    createdAt: coupon.createdAt,
    kind: coupon.origin === 'RETURN' ? 'exchange' : 'promotional',
    valueCents:
      coupon.origin === 'RETURN'
        ? (coupon.remainingCreditCents ?? coupon.discountCents ?? 0)
        : (coupon.discountCents ??
          Math.round((coupon.discountPercentage ?? 0) * 100)),
  };
}

export function mapReturn(item: ApiReturn): DemoExchange {
  const statuses: Record<string, DemoExchange['status']> = {
    EM_TROCA: 'requested',
    TROCA_AUTORIZADA: 'authorized',
    TROCA_NEGADA: 'denied',
    TROCADO: 'completed',
  };
  return {
    id: String(item.id),
    orderId: String(item.orderId),
    orderItemId: item.orderItemId === null ? '' : String(item.orderItemId),
    reason: item.reason,
    status: statuses[item.status] ?? 'requested',
    dispatch: item.trackingCode
      ? {
          carrier: '',
          postedAt: '',
          trackingCode: item.trackingCode,
        }
      : undefined,
  };
}
