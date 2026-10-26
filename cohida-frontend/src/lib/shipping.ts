export function calculateShippingCents(quantity: number, state?: string) {
  if (quantity <= 0) return 0;
  const baseCents = 1_000 + Math.max(0, quantity - 1) * 200;
  return state?.toUpperCase() === "SP" ? baseCents : baseCents + 1_000;
}
