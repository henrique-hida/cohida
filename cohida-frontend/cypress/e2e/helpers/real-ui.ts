/// <reference types="cypress" />

export type TestCustomer = { email: string; name: string; cpf: string };

function cpfFor(seed: number) {
  const digits = String(seed).slice(-9).padStart(9, "0").split("").map(Number);
  const check = (values: number[], factor: number) => {
    const sum = values.reduce(
      (total, value, index) => total + value * (factor - index),
      0,
    );
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  digits.push(check(digits, 10));
  digits.push(check(digits, 11));
  return digits.join("");
}

export function testCustomer(): TestCustomer {
  const id = Date.now();
  return {
    cpf: cpfFor(id),
    email: `e2e.${id}@cohida.test`,
    name: `Cliente E2E ${id}`,
  };
}

export function fillCustomerRegistration(customer: TestCustomer) {
  cy.get('input[name="name"]').type(customer.name);
  cy.get('input[name="cpf"]').type(customer.cpf);
  cy.get('input[name="birthDate"]').type("1995-05-15");
  cy.get('input[name="phone"]').type("11999991234");
  cy.get('input[name="email"]').type(customer.email);
  cy.get('input[name="password"]').type("Cypress@123");
  cy.get('input[name="passwordConfirmation"]').type("Cypress@123");
  cy.contains("button", "Continuar").click();
  cy.get('input[name="deliveryPostalCode"]').type("01001000");
  cy.get('input[name="deliveryStreet"]').clear().type("Praça da Sé");
  cy.get('input[name="deliveryNumber"]').type("100");
  cy.get('input[name="deliveryNeighborhood"]').clear().type("Sé");
  cy.get('input[name="deliveryCity"]').clear().type("São Paulo");
  cy.get('input[name="deliveryState"]').clear().type("SP");
  cy.get('input[name="deliveryCountry"]').clear().type("Brasil");
}

export function loginAsAdmin() {
  cy.clearLocalStorage();
  cy.visit("/entrar");
  cy.get('input[name="email"]').type("e2e.admin@cohida.test");
  cy.get('input[name="password"]').type("Cypress@123");
  cy.contains('button[type="submit"]', "Entrar").click();
  cy.location("pathname").should("eq", "/admin/clientes");
}
