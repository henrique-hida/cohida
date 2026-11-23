export interface CheckoutInput {
  deliveryAddressId: string;
  payments: Array<{ paymentCardId: string; amountCents: number }>;
  cartSignature: string;
}

export interface CheckoutAttempt {
  key: string;
  input: CheckoutInput;
}

function storageKey(customerId: string) {
  return `cohida-checkout-attempt:${customerId}`;
}

export function readCheckoutAttempt(
  customerId: string,
): CheckoutAttempt | null {
  const saved = localStorage.getItem(storageKey(customerId));
  if (!saved) return null;
  try {
    const attempt = JSON.parse(saved) as CheckoutAttempt;
    if (
      typeof attempt.key === 'string' &&
      typeof attempt.input?.deliveryAddressId === 'string' &&
      typeof attempt.input.cartSignature === 'string' &&
      Array.isArray(attempt.input.payments) &&
      attempt.input.payments.every(
        (payment) =>
          typeof payment.paymentCardId === 'string' &&
          typeof payment.amountCents === 'number',
      )
    )
      return attempt;
  } catch {
    // Report invalid persisted data instead of creating another attempt.
  }
  throw new Error(
    'Não foi possível recuperar a tentativa de compra salva neste navegador.',
  );
}

export function saveCheckoutAttempt(
  customerId: string,
  attempt: CheckoutAttempt,
) {
  localStorage.setItem(storageKey(customerId), JSON.stringify(attempt));
}

export function clearCheckoutAttempt(customerId: string, key: string) {
  const current = readCheckoutAttempt(customerId);
  if (current?.key === key) localStorage.removeItem(storageKey(customerId));
}
