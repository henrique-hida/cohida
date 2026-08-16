export type OrderStatus =
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'in_transit'
  | 'delivered'
  | 'in_exchange'
  | 'exchange_authorized'
  | 'exchanged'

export interface CartItem {
  id: string
  productId: string
  variantId: string
  quantity: number
  unitPriceCents: number
  reservationExpiresAt?: string
}

export interface Cart {
  id: string
  customerId?: string
  items: CartItem[]
  updatedAt: string
}

export interface Address {
  id: string
  label: string
  type: 'billing' | 'delivery'
  residenceType: string
  streetType: string
  street: string
  number: string
  neighborhood: string
  postalCode: string
  city: string
  state: string
  country: string
  notes?: string
}

export interface Customer {
  id: string
  code: string
  name: string
  email: string
  ranking: number
  addresses: Address[]
}

export interface Order {
  id: string
  customerId: string
  status: OrderStatus
  items: CartItem[]
  subtotalCents: number
  shippingCents: number
  discountCents: number
  totalCents: number
  createdAt: string
}
