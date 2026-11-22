import { PageContainer, StoreHeader } from '@/components/shared';
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

export function HomePage() {
  const { addCartItem, state } = useCommerce();
  const categories = useCategories();
  const cartItemCount = state.cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );

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
    <div className='min-h-svh bg-background'>
      <StoreHeader cartItemCount={cartItemCount} />
      <main>
        <HeroSection />
        <RecommendationsSection
          products={state.products}
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
      </main>
    </div>
  );
}
