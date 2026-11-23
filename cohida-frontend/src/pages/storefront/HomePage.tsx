import { PageContainer } from '@/components/shared';
import { HeroSection } from '@/components/home/HeroSection';
// prettier-ignore
import {
  RecommendationsSection,
} from '@/components/home/RecommendationsSection';
import { CategoriesSection } from '@/components/home/CategoriesSection';
// prettier-ignore
import {
  FeaturedProductsSection,
} from '@/components/home/FeaturedProductsSection';
// prettier-ignore
import {
  CommunityProductsSection,
} from '@/components/home/CommunityProductsSection';
import { GoalsSection } from '@/components/home/GoalsSection';
import { GuideSection } from '@/components/home/GuideSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { BenefitsSection } from '@/components/home/BenefitsSection';
import { useCommerce } from '@/data/useCommerce';
import { useCategories } from '@/data/useCategories';
import type { Product, ProductVariant } from '@/types';
import { useEffect, useState } from 'react';
import { apiRequest, getSessionRole } from '@/lib/customerApi';
import { commerceApi } from '@/lib/commerceApi';
import { mapProduct } from '@/data/commerce/mappers';

export function HomePage() {
  const { addCartItem, state } = useCommerce();
  const categories = useCategories();
  const [recommendations, setRecommendations] = useState<{
    customerId: string;
    products: Product[];
  } | null>(null);

  useEffect(() => {
    if (!state.sessionCustomerId || getSessionRole() !== 'CUSTOMER') {
      return;
    }
    const customerId = state.sessionCustomerId;
    let active = true;
    function load() {
      apiRequest<string[]>('/customers/me/chat/recommendations')
        .then(async (slugs) => {
          const responses = await Promise.allSettled(
            slugs.slice(0, 10).map((slug) => commerceApi.product(slug)),
          );
          const products = responses.flatMap((response) =>
            response.status === 'fulfilled' ? [mapProduct(response.value)] : [],
          );
          if (active) setRecommendations({ customerId, products });
        })
        .catch(() => {
          if (active) setRecommendations(null);
        });
    }
    load();
    window.addEventListener('cohida:preferences-changed', load);
    return () => {
      active = false;
      window.removeEventListener('cohida:preferences-changed', load);
    };
  }, [state.sessionCustomerId]);

  const available = state.products.filter(
    (product) =>
      product.status === 'active' &&
      product.variants.some((variant) => variant.stockQuantity > 0),
  );
  const recommendedProducts =
    recommendations && recommendations.customerId === state.sessionCustomerId
      ? recommendations.products.filter((product) =>
          product.variants.some((variant) => variant.stockQuantity > 0),
        )
      : available;

  async function addToCart(product: Product, variant: ProductVariant) {
    await addCartItem({
      id: `home-${crypto.randomUUID()}`,
      productId: product.id,
      quantity: 1,
      unitPriceCents: variant.priceCents ?? product.priceCents,
      variantId: variant.id,
    });
  }

  return (
    <div className='bg-background'>
      <HeroSection />
      <RecommendationsSection
        products={recommendedProducts}
        onAddToCart={addToCart}
      />
      <PageContainer className='pt-8 pb-16 sm:pt-12 sm:pb-24'>
        <CategoriesSection categories={categories} />
        <FeaturedProductsSection
          products={state.products}
          onAddToCart={addToCart}
        />
        <CommunityProductsSection products={state.products} />
        <GoalsSection products={state.products} />
        <GuideSection />
        <TestimonialsSection />
      </PageContainer>
      <BenefitsSection />
    </div>
  );
}
