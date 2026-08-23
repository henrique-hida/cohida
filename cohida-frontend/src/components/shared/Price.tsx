import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface PriceProps {
  className?: string;
  priceCents: number;
  compareAtPriceCents?: number;
}

export function Price({
  className,
  priceCents,
  compareAtPriceCents,
}: PriceProps) {
  const isDiscounted =
    compareAtPriceCents !== undefined && compareAtPriceCents > priceCents;

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className="text-lg font-semibold text-foreground">
        {formatCurrency(priceCents)}
      </span>
      {isDiscounted ? (
        <span className="text-sm text-muted-foreground line-through">
          {formatCurrency(compareAtPriceCents)}
        </span>
      ) : null}
    </div>
  );
}
