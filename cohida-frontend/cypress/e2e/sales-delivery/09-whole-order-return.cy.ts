import { loginAsAdmin, loginAsCustomer, startCheckoutWithFirstAvailableProduct } from "./helpers";

it("9) permite solicitar pela interface a troca da compra inteira", () => {
  loginAsCustomer("clara.demo@cohida.test");
  startCheckoutWithFirstAvailableProduct();
  cy.contains("button", "Confirmar pedido").click();
  cy.visit("/conta?secao=orders");
  cy.get('a[href^="/pedidos/"]').first().find("h3").invoke("text").then((orderId) => {
    loginAsAdmin();
    cy.visit(`/admin/pedidos/${orderId}`);
    cy.get('input[aria-label="Código de rastreio"]').type(`E2E-WHOLE-${Date.now()}`);
    cy.contains("button", "Despachar").click();
    cy.contains("button", "Confirmar entrega").click();
    cy.get('[role="dialog"]').contains("button", "Confirmar entrega").click();

    loginAsCustomer("clara.demo@cohida.test");
    cy.visit("/conta?secao=orders");
    cy.get(`a[href="/pedidos/${orderId}"]`).should("be.visible");
    cy.visit("/trocas");
    cy.contains("button", "Solicitar troca").click();
    cy.contains("label", "Pedido").find('button[role="combobox"]').click();
    cy.get('[role="option"]').contains(orderId).click();
    cy.get('input[name="wholeOrder"]').check();
    cy.contains("button", "Enviar solicitação").click();
    cy.contains("h2", "Solicitação enviada").should("be.visible");
  });
});
