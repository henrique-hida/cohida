/// <reference types="cypress" />

import {
  addFirstAvailableProductToCart,
  apiLogin,
  clearCart,
  loginAsAdmin,
  loginAsCustomer,
  startCheckoutWithFirstAvailableProduct,
} from "../sales-delivery/helpers";

export {
  addFirstAvailableProductToCart,
  clearCart,
  loginAsCustomer,
  startCheckoutWithFirstAvailableProduct,
};

export function createCoupon(
  code: string,
  kind: "exchange" | "promotional",
  value: string,
) {
  const now = new Date();
  return apiLogin("e2e.admin@cohida.test", "Cypress@123").then((accessToken) =>
    cy.request({
      body: {
        active: true,
        code,
        description:
          kind === "exchange"
            ? "Crédito de troca E2E"
            : "Cupom promocional E2E",
        discountCents: Math.round(Number(value) * 100),
        discountPercentage: null,
        discountType: "FIXED_AMOUNT",
        expiresAt: new Date(
          now.getFullYear() + 1,
          now.getMonth(),
          now.getDate(),
        ).toISOString(),
        maximumDiscountCents: null,
        maximumUses: kind === "promotional" ? 100 : null,
        minimumOrderValueCents: null,
        validFrom: new Date(now.getTime() - 60_000).toISOString(),
      },
      headers: { Authorization: `Bearer ${accessToken}` },
      method: "POST",
      url: "http://localhost:8080/api/admin/coupons",
    }),
  );
}

/** Creates prerequisite payment data without exercising the checkout card form. */
export function seedCard(
  email: string,
  label: string,
  number = "5555555555554444",
  processorToken = `e2e-${Date.now()}-${Math.random()}`,
) {
  return apiLogin(email).then((accessToken) =>
    cy.request({
      body: {
        cardNumber: number,
        expiryMonth: 12,
        expiryYear: 2030,
        label,
        processorToken,
      },
      headers: { Authorization: `Bearer ${accessToken}` },
      method: "POST",
      url: "http://localhost:8080/api/customers/me/cards",
    }),
  );
}

export function addCard(label: string, number = "5555555555554444") {
  cy.contains("button", "Usar outro cartão").click();
  cy.get('input[name="cardNumber"]').type(number);
  cy.get('input[name="label"]').last().type(label);
  cy.get('input[name="expiry"]').type("12/30");
  cy.get('input[maxlength="4"]').type("123");
  cy.contains("button", "Usar este cartão").click();
  cy.contains(label).should("be.visible");
}

export function addAddress(label: string) {
  cy.contains("button", "Adicionar endereço").click();
  cy.get('input[name="label"]').first().type(label);
  cy.get('input[name="postalCode"]').type("01001000");
  cy.get('input[name="number"]').type("100");
  cy.get('input[name="street"]').type("Praça da Sé");
  cy.get('input[name="neighborhood"]').type("Sé");
  cy.get('input[name="city"]').type("São Paulo");
  cy.get('input[name="state"]').type("SP");
  cy.contains("button", "Usar este endereço").click();
  cy.contains(label).should("be.visible");
}

export function totalCents() {
  return cy
    .contains("dt", "Total")
    .next("dd")
    .invoke("text")
    .then((text) => {
      const normalized = text.replace(/[^0-9,]/g, "").replace(",", ".");
      return Math.round(Number(normalized) * 100);
    });
}

export function confirmOrder() {
  cy.contains("button", "Confirmar pedido").click();
  cy.contains("h1", "Pedido em processamento").should("be.visible");
}
