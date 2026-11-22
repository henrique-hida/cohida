function checkLayout() {
  cy.get('[data-slot="page-header"]')
    .should('be.visible')
    .then(($header) => {
      const header = $header[0];
      const headerBottom = header.getBoundingClientRect().bottom;
      const textBottom = Math.max(
        ...Array.from(header.querySelectorAll('h1, p, button, a')).map(
          (element) => element.getBoundingClientRect().bottom,
        ),
      );
      cy.get('[data-slot="page-content"]')
        .should('be.visible')
        .then(($content) => {
          const contentTop = $content[0].getBoundingClientRect().top;
          expect(
            contentTop,
            'conteúdo abaixo do texto e das ações',
          ).to.be.greaterThan(textBottom);
          expect(
            contentTop,
            'conteúdo sobre a faixa do cabeçalho',
          ).to.be.lessThan(headerBottom);
        });
    });
}

describe('Layout responsivo das páginas', () => {
  for (const width of [375, 1280]) {
    it(`mantém conteúdo e cabeçalho separados na loja com ${width}px`, () => {
      cy.viewport(width, 850);
      for (const route of ['/produtos', '/carrinho', '/checkout']) {
        cy.visit(route);
        checkLayout();
      }
    });
  }

  for (const width of [375, 1280]) {
    it(`mantém o mesmo layout no painel administrativo com ${width}px`, () => {
      cy.viewport(width, 850);
      cy.visit('/entrar');
      cy.get('input[name="email"]').type('e2e.admin@cohida.test');
      cy.get('input[name="password"]').type('Cypress@123', {
        log: false,
      });
      cy.contains('button[type="submit"]', 'Entrar').click();
      cy.location('pathname').should('eq', '/admin/clientes');
      checkLayout();
    });
  }
});
