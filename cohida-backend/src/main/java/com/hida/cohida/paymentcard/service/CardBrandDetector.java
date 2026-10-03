package com.hida.cohida.paymentcard.service;

import com.hida.cohida.auth.exception.InvalidRequestException;

final class CardBrandDetector {
    private CardBrandDetector() {
    }

    static CardDetails detect(String cardNumber) {
        String number = cardNumber == null ? "" : cardNumber.replaceAll("[\\s-]", "");
        if (!number.matches("\\d{12,19}") || !passesLuhn(number)) {
            throw new InvalidRequestException("Informe um número de cartão válido.");
        }
        return new CardDetails(brandFor(number), number.substring(number.length() - 4));
    }

    private static String brandFor(String number) {
        if (number.matches("^(401178|431274|438935|451416|457393|457632|504175|5067|509|627780|636297|636368|6500|6504|6505|6507|6509|6516|6550).*"))
            return "Elo";
        if (number.startsWith("4")) return "Visa";
        if (number.matches("^(5[1-5]|2[2-7]).*")) return "Mastercard";
        if (number.matches("^3[47].*")) return "American Express";
        if (number.matches("^(6011|65|64[4-9]).*")) return "Discover";
        if (number.matches("^(606282|3841).*")) return "Hipercard";
        if (number.matches("^3(0[0-5]|[68]).*")) return "Diners Club";
        return "Outra";
    }

    private static boolean passesLuhn(String number) {
        int sum = 0;
        boolean doubleDigit = false;
        for (int index = number.length() - 1; index >= 0; index--) {
            int digit = number.charAt(index) - '0';
            if (doubleDigit && (digit *= 2) > 9) digit -= 9;
            sum += digit;
            doubleDigit = !doubleDigit;
        }
        return sum % 10 == 0;
    }

    record CardDetails(String brand, String lastDigits) {
    }
}
