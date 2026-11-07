import { loginAsCustomer, startCheckoutWithFirstAvailableProduct } from "./helpers";

it("1) finaliza pela interface uma compra aprovada com um cartão salvo", () => {
  loginAsCustomer("clara.demo@cohida.test");
  startCheckoutWithFirstAvailableProduct();
  cy.contains("button", "Confirmar pedido").click();
  cy.contains("h1", "Pedido em processamento").should("be.visible");
  cy.contains("a", "Continuar comprando").click();
  cy.visit("/pedidos");
  cy.contains("Aprovado").should("be.visible");
});
