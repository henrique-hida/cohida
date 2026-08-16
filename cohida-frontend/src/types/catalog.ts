export type ProductStatus = 'active' | 'inactive'

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  imageUrl?: string
}

export interface ProductImage {
  id: string
  alt: string
  src: string
}

export interface ProductVariant {
  id: string
  sku: string
  label: string
  color?: string
  size?: string
  stockQuantity: number
}

export interface Product {
  id: string
  sku: string
  slug: string
  name: string
  brand: string
  description: string
  priceCents: number
  compareAtPriceCents?: number
  rating: number
  reviewCount: number
  status: ProductStatus
  categoryIds: string[]
  images: ProductImage[]
  variants: ProductVariant[]
  attributes: Record<string, string>
  createdAt: string
}

export interface CatalogFilters {
  category?: string
  brand?: string
  minPriceCents?: number
  maxPriceCents?: number
  query?: string
}
