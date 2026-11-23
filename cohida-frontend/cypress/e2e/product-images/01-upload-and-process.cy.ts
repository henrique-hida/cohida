it('cria produto e apresenta a imagem processada após recarregar', () => {
  const suffix = Date.now();
  const name = `Imagem E2E ${suffix}`;
  cy.visit('/entrar');
  cy.get('input[type="email"]').type('e2e.admin@cohida.test');
  cy.get('input[type="password"]').type('Cypress@123');
  cy.get('form').contains('button', 'Entrar').click();
  cy.location('pathname').should('include', '/admin');
  cy.visit('/admin/produtos/novo');
  cy.get('input[name="name"]').type(name);
  cy.get('input[name="brand"]').type('Teste');
  cy.get('textarea[name="description"]').type('Produto para verificar imagem.');
  cy.get('input[type="file"]').selectFile('src/assets/CoHidaHero.png', {
    force: true,
  });
  cy.get('button[aria-label="Selecionar categorias do produto"]').click();
  cy.contains('label', 'Futebol').click();
  cy.get('body').type('{esc}');
  cy.contains('label', 'SKU').find('input').type(`IMG-${suffix}`);
  cy.contains('label', 'Preço (R$)').find('input').clear().type('20');
  cy.contains('label', /^Estoque$/)
    .find('input')
    .clear()
    .type('3');
  cy.contains('button', 'Salvar produto').click();
  cy.location('pathname').should('eq', '/admin/produtos');
  cy.get('input[placeholder="Nome, marca, SKU ou categoria"]').type(name);
  cy.contains('tr[role="link"]', name).click();
  cy.contains('a', 'Editar').click();
  cy.contains('h1', 'Editar produto').should('be.visible');
  cy.get('img[alt="Prévia da foto do produto"]', { timeout: 30000 })
    .should('be.visible')
    .should(($image) => {
      expect(($image[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0);
      expect(($image[0] as HTMLImageElement).currentSrc).to.match(/\.webp$/);
    });
  cy.reload();
  cy.get('img[alt="Prévia da foto do produto"]', { timeout: 30000 })
    .should('be.visible')
    .and(($image) => {
      expect(($image[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0);
    });
});

it('permite tentar novamente uma foto que não pôde ser processada', () => {
  const suffix = Date.now();
  const name = `Imagem inválida E2E ${suffix}`;
  cy.visit('/entrar');
  cy.get('input[type="email"]').type('e2e.admin@cohida.test');
  cy.get('input[type="password"]').type('Cypress@123');
  cy.get('form').contains('button', 'Entrar').click();
  cy.location('pathname').should('include', '/admin');
  cy.visit('/admin/produtos/novo');
  cy.get('input[name="name"]').type(name);
  cy.get('input[name="brand"]').type('Teste');
  cy.get('textarea[name="description"]').type('Imagem inválida para teste.');
  cy.get('input[type="file"]').selectFile(
    {
      contents: Cypress.Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]),
      fileName: 'foto.png',
      mimeType: 'image/png',
    },
    { force: true },
  );
  cy.get('button[aria-label="Selecionar categorias do produto"]').click();
  cy.contains('label', 'Futebol').click();
  cy.get('body').type('{esc}');
  cy.contains('label', 'SKU').find('input').type(`IMG-INVALID-${suffix}`);
  cy.contains('label', 'Preço (R$)').find('input').clear().type('20');
  cy.contains('label', /^Estoque$/)
    .find('input')
    .clear()
    .type('3');
  cy.contains('button', 'Salvar produto').click();
  cy.location('pathname').should('eq', '/admin/produtos');
  cy.get('input[placeholder="Nome, marca, SKU ou categoria"]').type(name);
  cy.contains('tr[role="link"]', name).click();
  cy.contains('a', 'Editar').click();
  cy.contains('Não foi possível processar a foto.', { timeout: 30000 }).should(
    'be.visible',
  );
  cy.contains('button', 'Tentar novamente').click();
  cy.contains('Não foi possível processar a foto.', { timeout: 30000 }).should(
    'be.visible',
  );
});
