/** Boundary for replacing the local payment simulator with a real gateway. */
export function tokenizeCardForProcessor(cardNumber: string) {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits === "4000000000000002") return `declined-${crypto.randomUUID()}`;
  return `demo-${crypto.randomUUID()}`;
}
