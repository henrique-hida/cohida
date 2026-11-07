import {
  loginAsAdmin,
  loginAsCustomer,
  startCheckoutWithFirstAvailableProduct,
} from "./helpers";

it("1) finaliza pela interface uma compra aprovada com um cartão salvo", () => {
  loginAsCustomer("clara.demo@cohida.test");
  startCheckoutWithFirstAvailableProduct();
  cy.contains("button", "Confirmar pedido").click();
  cy.contains("h1", "Pedido em processamento").should("be.visible");
  cy.contains("Número do pedido")
    .next()
    .invoke("text")
    .then((number) => {
      const orderId = number.replace("#", "").trim();
      loginAsAdmin();
      cy.visit(`/admin/pedidos/${orderId}`);
      cy.contains("Aprovada").should("be.visible");
    });
});
