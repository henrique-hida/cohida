import { clearCart, loginAsCustomer } from "../helpers/purchase-flows-ui";

it("inclui dois produtos esportivos e altera a quantidade pelo carrinho", () => {
  loginAsCustomer("ana.demo@cohida.test");
  cy.visit("/carrinho");
  cy.contains("h1", "Carrinho").should("be.visible");
  clearCart();
  cy.visit("/produtos");
  cy.get("button")
    .filter(":not(:disabled)")
    .filter((_, button) => button.textContent?.trim() === "Adicionar")
    .should("have.length.at.least", 2)
    .eq(0)
    .click();
  cy.get("button")
    .filter(":not(:disabled)")
    .filter((_, button) => button.textContent?.trim() === "Adicionar")
    .eq(1)
    .click();
  cy.visit("/carrinho");
  cy.get("article").should("have.length.at.least", 2);
  cy.get('button[aria-label^="Aumentar quantidade de"]')
    .first()
    .closest("article")
    .find("span.w-8")
    .invoke("text")
    .then((quantityText) => {
      const quantity = Number(quantityText);
      cy.get('button[aria-label^="Aumentar quantidade de"]')
        .first()
        .click();
      cy.get("article")
        .first()
        .find("span.w-8")
        .should("have.text", String(quantity + 1));
    });
  cy.contains("dt", "Total")
    .next("dd")
    .invoke("text")
    .should("match", /R\$\s*\d+/);
});
