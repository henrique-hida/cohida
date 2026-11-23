function signIn(email: string, password: string) {
  cy.visit('/entrar');
  cy.get('input[name="email"]').clear().type(email);
  cy.get('input[name="password"]').clear().type(password);
  cy.get('form').contains('button', 'Entrar').click();
  cy.location('pathname').should('not.eq', '/entrar');
}

it('renova a sessão e alterna contas sem guardar tokens no navegador', () => {
  cy.clearLocalStorage();
  cy.clearCookies();
  signIn('clara.demo@cohida.test', 'Demo@123');
  cy.window().then((window) => {
    expect(window.localStorage.getItem('cohida-access-token')).to.equal(null);
    const accounts = window.localStorage.getItem('cohida-saved-accounts') ?? '';
    expect(accounts).not.to.contain('accessToken');
    expect(accounts).not.to.contain('"token"');
  });
  cy.intercept('POST', '**/api/auth/sessions/*/refresh').as('refresh');
  cy.reload();
  cy.wait('@refresh').its('response.statusCode').should('eq', 200);
  cy.contains('button[aria-label="Menu da conta"]', 'CS').should('be.visible');
  signIn('e2e.admin@cohida.test', 'Cypress@123');
  cy.get('button[aria-label="Menu da administradora"]').click();
  cy.contains('Alternar conta').click();
  cy.contains('[role="option"]', 'Clara Souza').click();
  cy.location('pathname').should('eq', '/');
  cy.contains('button[aria-label="Menu da conta"]', 'CS').should('be.visible');
  cy.intercept('POST', '**/api/auth/sessions/*/logout').as('logout');
  cy.get('button[aria-label="Menu da conta"]').click();
  cy.contains('a', 'Sair').click();
  cy.wait('@logout').its('response.statusCode').should('eq', 204);
  cy.get('button[aria-label="Entrar ou criar conta"]').should('be.visible');
});
