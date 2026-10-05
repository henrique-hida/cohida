export const cardBrands = [
  "Visa",
  "Mastercard",
  "Elo",
  "American Express",
  "Hipercard",
] as const;

export function detectCardBrand(
  value: string,
): (typeof cardBrands)[number] | null {
  const digits = value.replace(/\D/g, "");

  if (
    /^(401178|401179|431274|438935|451416|457393|457631|457632|504175|506699|5067|5090|627780|636297|636368|6500|6504|6505|6507|6509|6516|6550)/.test(
      digits,
    )
  ) {
    return "Elo";
  }
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2(?:2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) {
    return "Mastercard";
  }
  if (/^3[47]/.test(digits)) return "American Express";
  if (/^(606282|3841)/.test(digits)) return "Hipercard";

  return null;
}

export function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.replace(/(\d{2})(\d)/, "$1/$2");
}

export function formatCvv(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}
