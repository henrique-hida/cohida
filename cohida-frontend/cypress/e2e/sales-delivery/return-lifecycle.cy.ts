import { loginAsAdmin, loginAsCustomer, startCheckoutWithFirstAvailableProduct } from "./helpers";

it("9, 10 e 11) solicita, autoriza, recebe e reutiliza pela interface um cupom de troca", () => {
  loginAsCustomer("bruno.demo@cohida.test");
  startCheckoutWithFirstAvailableProduct();
  cy.contains("button", "Confirmar pedido").click();
  cy.visit("/pedidos");
  cy.get('a[href^="/pedidos/"]').first().find("h3").invoke("text").then((orderId) => {
    loginAsAdmin();
    cy.visit(`/admin/pedidos/${orderId}`);
    cy.get('input[aria-label="Código de rastreio"]').type(`E2E-RETURN-${Date.now()}`);
    cy.contains("button", "Despachar").click();
    cy.contains("button", "Confirmar entrega").click();
    cy.get('[role="dialog"]').contains("button", "Confirmar entrega").click();

    loginAsCustomer("bruno.demo@cohida.test");
    cy.visit("/conta?secao=orders");
    cy.get(`a[href="/pedidos/${orderId}"]`).should("be.visible");
    cy.visit("/trocas");
    cy.contains("button", "Solicitar troca").click();
    cy.contains("label", "Pedido").find('button[role="combobox"]').click();
    cy.get('[role="option"]').contains(orderId).click();
    cy.contains("button", "Enviar solicitação").click();
    cy.contains("h2", "Solicitação enviada").should("be.visible");
    cy.contains("button", "Ver solicitações").click();
    cy.contains("p", /^Solicitação #/).first().invoke("text").then((text) => {
      const requestId = text.replace("Solicitação #", "").trim();
      loginAsAdmin();
      cy.visit("/admin/trocas");
      cy.contains("a", `#${requestId}`).click();
      cy.contains("button", "Autorizar troca").click();
      cy.contains("Troca autorizada e cliente notificado.").should("be.visible");
      cy.contains("button", "Confirmar recebimento").click();
      cy.get('[role="dialog"]').contains("button", "Confirmar recebimento").click();
      cy.contains("Cupom emitido:").invoke("text").then((couponText) => {
        const couponCode = couponText.match(/TROCA-[A-Z0-9-]+/)?.[0];
        expect(couponCode, "issued exchange coupon").to.match(/^TROCA-[A-Z0-9-]+$/);

        loginAsCustomer("bruno.demo@cohida.test");
        cy.get('button[aria-label="Notificações"]').click();
        cy.contains("Sua troca foi autorizada.").should("be.visible");
        cy.visit("/cupons");
        cy.contains(couponCode!).should("be.visible");
        startCheckoutWithFirstAvailableProduct();
        cy.get("#coupon").type(couponCode!);
        cy.contains(couponCode!).should("be.visible");
        cy.contains("button", "Confirmar pedido").click();
        cy.contains("h1", "Pedido em processamento").should("be.visible");
      });
    });
  });
});
