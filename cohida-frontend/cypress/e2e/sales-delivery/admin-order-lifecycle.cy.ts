import { loginAsAdmin } from "./helpers";

it("7) conduz pela interface administrativa uma venda aprovada até a entrega", () => {
  loginAsAdmin();
  cy.visit("/admin/pedidos");
  cy.contains("a", "Aprovada").first().click();
  cy.get('input[aria-label="Código de rastreio"]').type(`E2E-${Date.now()}`);
  cy.contains("button", "Despachar").click();
  cy.contains("Em trânsito").should("be.visible");
  cy.contains("button", "Confirmar entrega").click();
  cy.get('[role="dialog"]').contains("button", "Confirmar entrega").click();
  cy.contains("Entregue").should("be.visible");
});
