import type { cardBrands } from "@/lib/card";

const iconByBrand: Record<(typeof cardBrands)[number], string> = {
  "American Express":
    "https://cdn.jsdelivr.net/npm/payment-icons@1.2.1/min/flat/amex.svg",
  Elo: "https://cdn.jsdelivr.net/npm/payment-icons@1.2.1/min/flat/elo.svg",
  Hipercard:
    "https://cdn.jsdelivr.net/npm/payment-icons@1.2.1/min/flat/hipercard.svg",
  Mastercard:
    "https://cdn.jsdelivr.net/npm/payment-icons@1.2.1/min/flat/mastercard.svg",
  Visa: "https://cdn.jsdelivr.net/npm/payment-icons@1.2.1/min/flat/visa.svg",
};

export function CardBrandIcon({
  brand,
}: {
  brand: (typeof cardBrands)[number];
}) {
  return (
    <img
      alt={brand}
      className="h-5 w-12 object-contain object-left"
      src={iconByBrand[brand]}
    />
  );
}
