import { clearCart, loginAsCustomer } from '../sales-delivery/helpers';

it('mantém no carrinho um produto da segunda página', () => {
  loginAsCustomer('clara.demo@cohida.test');
  cy.visit('/carrinho');
  clearCart();
  cy.visit('/produtos');
  cy.contains('Página 1 de').should('be.visible');
  cy.contains('button', 'Próxima').click();
  cy.contains('Página 2 de').should('be.visible');
  cy.get('main a[href^="/produtos/"]')
    .first()
    .invoke('attr', 'aria-label')
    .then((label) => {
      const name = String(label).replace(/^Ver /, '');
      cy.get('main a[href^="/produtos/"]').first().click();
      cy.get('h1').should('have.text', name);
      cy.contains('button', 'Adicionar ao carrinho').click();
      cy.visit('/carrinho');
      cy.contains(name).should('be.visible');
      cy.reload();
      cy.contains(name).should('be.visible');
    });
});
