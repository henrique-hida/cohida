import { loginInBrowser, prepare, visitAnalytics } from './helpers';

it('7) permite a análise ao administrador e nega ao cliente', () => {
  prepare();
  visitAnalytics();
  cy.contains('Análises de vendas').should('be.visible');
  loginInBrowser('ana.demo@cohida.test', 'Demo@123');
  cy.visit('/admin/analises');
  cy.location('pathname').should('eq', '/entrar');
  cy.contains('Análises de vendas').should('not.exist');
});
