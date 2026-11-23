import { loginAsCustomer } from '../sales-delivery/helpers';

it('mantém a conta ao navegar por recargas consecutivas', () => {
  loginAsCustomer('clara.demo@cohida.test');
  cy.window()
    .its('sessionStorage')
    .invoke('getItem', 'cohida-current-session')
    .should('be.a', 'string');
  cy.visit('/carrinho');
  cy.window()
    .its('sessionStorage')
    .invoke('getItem', 'cohida-current-session')
    .should('be.a', 'string');
  cy.visit('/produtos/bola-strike-pro');
  cy.window()
    .its('sessionStorage')
    .invoke('getItem', 'cohida-current-session')
    .should('be.a', 'string');
  cy.contains('button', 'Adicionar ao carrinho').click();
  cy.get('a[href="/carrinho"]').first().click();
  cy.contains('Bola Strike Pro').should('be.visible');
});
