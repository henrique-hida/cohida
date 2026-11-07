import {
  loginAsAdmin,
  loginAsCustomer,
  startCheckoutWithFirstAvailableProduct,
} from "./helpers";

it("4) emite pela interface um cupom de troca para a diferença de cupons acima da compra", () => {
  const code = `E2ESALDO${Date.now()}`;
  loginAsAdmin();
  cy.visit("/admin/cupons/novo");
  cy.get('input[name="code"]').type(code);
  cy.get('textarea[name="description"]').type("Crédito de troca de teste");
  cy.get('input[name="discountValue"]').type("200");
  cy.contains("button", "Criar cupom").click();
  cy.location("pathname").should("eq", "/admin/cupons");

  loginAsCustomer("bruno.demo@cohida.test");
  startCheckoutWithFirstAvailableProduct("DEMO - Bola Strike Pro");
  cy.get("#coupon").type(code);
  cy.contains(code).should("be.visible");
  cy.contains("button", "Confirmar pedido").click();
  cy.contains("h1", "Pedido em processamento").should("be.visible");
  cy.contains("Cupom de troca emitido").should("be.visible");
  cy.contains("R$ 40,10").should("be.visible");
});
