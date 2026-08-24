export const cardBrands = [
  "Visa",
  "Mastercard",
  "Elo",
  "American Express",
  "Hipercard",
];

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
