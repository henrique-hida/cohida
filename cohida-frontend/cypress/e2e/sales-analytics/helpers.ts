/// <reference types="cypress" />

export const api = 'http://localhost:8080/api';
export const year = new Date().getFullYear();

export function login(
  email = 'e2e.admin@cohida.test',
  password = 'Cypress@123',
) {
  return cy
    .request<{ accessToken: string }>('POST', `${api}/auth/login`, {
      email,
      password,
    })
    .its('body.accessToken');
}

export function loginInBrowser(
  email = 'e2e.admin@cohida.test',
  password = 'Cypress@123',
) {
  cy.visit('/entrar');
  cy.get('input[name="email"]').clear().type(email);
  cy.get('input[name="password"]').clear().type(password);
  cy.get('form').contains('button', 'Entrar').click();
  cy.location('pathname').should('not.eq', '/entrar');
}

export function prepare() {
  cy.task('prepareSalesAnalytics');
}

export function visitAnalytics() {
  cy.intercept('GET', '**/api/admin/analytics/sales?*').as('sales');
  loginInBrowser();
  cy.visit('/admin/analises');
  cy.wait('@sales');
}

export function selectCategories(...names: string[]) {
  cy.get('button[aria-label="Limpar filtro de categorias"]').click();
  cy.get('button[aria-label="Filtrar análises por categoria"]').click();
  names.forEach((name) => {
    cy.contains('label', name).click();
    cy.wait('@sales');
  });
  cy.get('button[aria-label="Filtrar análises por categoria"]').click();
}

export function expectChartValue(
  month: string,
  category: string,
  value: string,
) {
  cy.get('.recharts-wrapper')
    .first()
    .should(($chart) => {
      const chart = $chart[0];
      const tick = [...chart.querySelectorAll('svg text')].find((element) =>
        element.textContent?.toLowerCase().includes(month),
      );
      expect(tick, `mês ${month} no gráfico`).not.to.equal(undefined);
      const tickRect = tick!.getBoundingClientRect();
      const chartRect = chart.getBoundingClientRect();
      const win = chart.ownerDocument.defaultView!;
      chart.dispatchEvent(
        new win.MouseEvent('mousemove', {
          clientX: tickRect.left + tickRect.width / 2 + 3,
          clientY: chartRect.top + chartRect.height / 2,
          bubbles: true,
        }),
      );
      const tooltip = chart.querySelector(
        '.recharts-tooltip-wrapper',
      ) as HTMLElement | null;
      expect(tooltip && win.getComputedStyle(tooltip).visibility).to.eq(
        'visible',
      );
      const row = [...(tooltip?.querySelectorAll('li') ?? [])].find((element) =>
        element.textContent?.includes(category),
      );
      expect(row?.textContent).to.include(value);
    });
}
