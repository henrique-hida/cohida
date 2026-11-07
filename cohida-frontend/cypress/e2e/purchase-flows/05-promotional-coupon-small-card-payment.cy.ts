import {
  confirmOrder,
  createCoupon,
  loginAsCustomer,
  startCheckoutWithFirstAvailableProduct,
} from "../helpers/purchase-flows-ui";

it("aceita cartão abaixo de R$ 10,00 quando cupom promocional cobre o restante", () => {
  const code = `E2E-RN0035-${Date.now()}`;
  createCoupon(code, "promotional", "154.90");
  loginAsCustomer("bruno.demo@cohida.test");
  startCheckoutWithFirstAvailableProduct();
  cy.get("#coupon").type(code);
  cy.contains(code).should("be.visible");
  cy.contains("R$ 5,00").should("be.visible");
  confirmOrder();
});
