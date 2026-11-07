import { fillCustomerRegistration, testCustomer } from "../helpers/real-ui";

it("8) não oferece pela interface troca para um pedido que não foi entregue", () => {
  const customer = testCustomer();
  cy.visit("/entrar");
  cy.contains("button", "Criar conta").click();
  fillCustomerRegistration(customer);
  cy.contains('form button[type="submit"]', "Criar conta").click();
  cy.location("pathname").should("eq", "/");
  cy.visit("/trocas");
  cy.contains("button", "Solicitar troca").click();
  cy.contains("label", "Pedido").find('button[role="combobox"]').click();
  cy.get('[role="option"]').should("not.exist");
  cy.contains("Apenas itens de pedidos entregues podem ser trocados.").should("be.visible");
});
