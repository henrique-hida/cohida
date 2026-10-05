import { ShoppingCart, Star } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Price } from "@/components/shared/Price";
import type { Product, ProductVariant } from "@/types";

interface ProductCardProps {
  categoryName?: string;
  onAddToCart?: (product: Product, variant: ProductVariant) => void;
  product: Product;
}

export function ProductCard({
  categoryName,
  onAddToCart,
  product,
}: ProductCardProps) {
  const firstAvailableVariant = product.variants.find(
    (variant) => variant.stockQuantity > 0,
  );
  const isAvailable = firstAvailableVariant !== undefined;

  return (
    <Card className="h-full gap-4 pb-4 pt-0">
      <Link
        aria-label={`Ver ${product.name}`}
        className="block aspect-[4/3] overflow-hidden bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        to={`/produtos/${product.slug}`}
      >
        {product.images[0] ? (
          <img
            alt={product.images[0].alt}
            className="size-full object-cover object-center transition-transform duration-300 group-hover/card:scale-105"
            src={product.images[0].src}
          />
        ) : (
          <span className="flex size-full items-center justify-center text-5xl font-semibold text-muted-foreground">
            {product.name.slice(0, 1)}
          </span>
        )}
      </Link>
      <CardHeader className="gap-2 px-4">
        <div className="flex items-center justify-between gap-3">
          {categoryName ? (
            <Badge variant="secondary">{categoryName}</Badge>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star
              aria-hidden="true"
              className="size-3 fill-primary text-primary"
            />
            {product.rating.toFixed(1)} ({product.reviewCount})
          </span>
        </div>
        <CardTitle>
          <Link
            className="outline-none hover:text-primary focus-visible:text-primary"
            to={`/produtos/${product.slug}`}
          >
            {product.name}
          </Link>
        </CardTitle>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>
      </CardHeader>
      <CardContent className="mt-auto px-4">
        <Price
          compareAtPriceCents={product.compareAtPriceCents}
          priceCents={product.priceCents}
        />
      </CardContent>
      <CardFooter className="justify-end border-t-0 bg-transparent px-4 pb-4 pt-0">
        <Button
          disabled={!isAvailable}
          onClick={() =>
            firstAvailableVariant &&
            onAddToCart?.(product, firstAvailableVariant)
          }
        >
          <ShoppingCart aria-hidden="true" />
          {isAvailable ? "Adicionar" : "Indisponível"}
        </Button>
      </CardFooter>
    </Card>
  );
}
