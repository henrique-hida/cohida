import { loginAsAdmin, loginAsCustomer, startCheckoutWithFirstAvailableProduct } from "./helpers";

it("3) permite pela interface cartão de R$ 5,00 quando cupom promocional cobre o restante", () => {
  const code = `E2EPROMO${Date.now()}`;
  loginAsAdmin();
  cy.visit("/admin/cupons/novo");
  cy.get('input[name="code"]').type(code);
  cy.get('textarea[name="description"]').type("Cupom promocional de teste");
  cy.get('input[name="discountValue"]').type("154.90");
  cy.contains("button", "Criar cupom").click();
  cy.location("pathname").should("eq", "/admin/cupons");

  loginAsCustomer("bruno.demo@cohida.test");
  startCheckoutWithFirstAvailableProduct();
  cy.get("#coupon").type(code);
  cy.contains(code).should("be.visible");
  cy.contains("R$ 5,00").should("be.visible");
  cy.contains("button", "Confirmar pedido").click();
  cy.contains("h1", "Pedido em processamento").should("be.visible");
});
