import { ShoppingBag, Star } from "lucide-react";

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
    <Card className="h-full gap-4 py-4">
      <div className="mx-4 flex aspect-square items-center justify-center rounded-lg bg-muted text-5xl font-semibold text-muted-foreground">
        {product.images[0] ? (
          <img
            alt={product.images[0].alt}
            className="size-full object-cover"
            src={product.images[0].src}
          />
        ) : (
          product.name.slice(0, 1)
        )}
      </div>
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
        <CardTitle>{product.name}</CardTitle>
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
      <CardFooter className="mx-4 justify-end rounded-lg p-0 pt-0">
        <Button
          disabled={!isAvailable}
          onClick={() =>
            firstAvailableVariant &&
            onAddToCart?.(product, firstAvailableVariant)
          }
        >
          <ShoppingBag aria-hidden="true" />
          {isAvailable ? "Adicionar" : "Indisponível"}
        </Button>
      </CardFooter>
    </Card>
  );
}
