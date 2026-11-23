it('mantém a sessão quando uma ação é negada', () => {
  cy.visit('/entrar');
  cy.get('input[name="email"]').type('clara.demo@cohida.test');
  cy.get('input[name="password"]').type('Demo@123');
  cy.get('form').contains('button', 'Entrar').click();
  cy.location('pathname').should('eq', '/');
  cy.visit('/conta');
  cy.contains('Dados pessoais').should('be.visible');
  cy.intercept('PATCH', '**/api/customers/me', {
    statusCode: 403,
    body: { message: 'Você não tem permissão para realizar esta ação.' },
  }).as('denied');
  cy.contains('button', 'Editar').click();
  cy.contains('button', 'Salvar alterações').click();
  cy.wait('@denied');
  cy.contains('Você não tem permissão para realizar esta ação.').should(
    'be.visible',
  );
  cy.location('pathname').should('eq', '/conta');
  cy.get('input[name="name"]').should('not.be.disabled');
  cy.window()
    .its('localStorage')
    .invoke('getItem', 'cohida-access-token')
    .should('be.a', 'string');
});
