import {
  fillCustomerRegistration,
  loginAsAdmin,
  testCustomer,
} from "../helpers/real-ui";

it("cria uma conta pela interface e abre a área do cliente", () => {
  const customer = testCustomer();
  cy.clearLocalStorage();
  cy.visit("/entrar");
  cy.contains("button", "Criar conta").click();
  fillCustomerRegistration(customer);
  cy.contains('form button[type="submit"]', "Criar conta").click();
  cy.location("pathname").should("eq", "/");
});

it("cadasta, localiza, edita e inativa um cliente exclusivamente pelo painel", () => {
  const customer = testCustomer();
  loginAsAdmin();
  cy.contains("a", "Novo cliente").click();
  fillCustomerRegistration(customer);
  cy.contains('form button[type="submit"]', "Salvar cliente").click();
  cy.contains("Cliente salvo com sucesso.").should("be.visible");
  cy.visit("/admin/clientes");
  cy.get('input[aria-label="Pesquisar em clientes"]').type(customer.email);
  cy.contains("td", customer.name).should("be.visible").click();
  cy.contains("a", "Editar").click();
  cy.get('input[name="name"]').clear().type(`${customer.name} editado`);
  cy.contains("button", "Continuar").click();
  cy.contains('form button[type="submit"]', "Salvar alterações").click();
  cy.contains("Alterações salvas com sucesso.").should("be.visible");
  cy.visit("/admin/clientes");
  cy.get('input[aria-label="Pesquisar em clientes"]').type(customer.email);
  cy.get('[aria-label^="Ações do"]').click();
  cy.get('[role="menuitem"]').contains("Excluir").click();
  cy.get('[role="dialog"] button').contains("Excluir").click();
  cy.contains("td", customer.email).should("not.exist");
});

it("bloqueia o painel administrativo para uma sessão real de cliente", () => {
  const customer = testCustomer();
  cy.visit("/entrar");
  cy.contains("button", "Criar conta").click();
  fillCustomerRegistration(customer);
  cy.contains('form button[type="submit"]', "Criar conta").click();
  cy.visit("/admin/clientes");
  cy.location("pathname").should("eq", "/entrar");
});
