import { apiBaseUrl } from '@/lib/customer/config';

function apiOrigin() {
  const origin =
    typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  return new URL(apiBaseUrl, origin).origin;
}

export function resolveProductImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) return undefined;
  if (imageUrl.startsWith('/api/products/images/')) {
    return new URL(imageUrl, apiOrigin()).toString();
  }
  return imageUrl;
}

export function toStoredProductImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) return null;
  try {
    const parsed = new URL(
      imageUrl,
      typeof window === 'undefined'
        ? 'http://localhost'
        : window.location.origin,
    );
    return parsed.origin === apiOrigin() &&
      parsed.pathname.startsWith('/api/products/images/')
      ? parsed.pathname
      : imageUrl;
  } catch {
    return imageUrl;
  }
}
