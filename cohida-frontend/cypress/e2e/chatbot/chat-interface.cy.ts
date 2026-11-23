describe('Interface do assistente', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/customers/me/chat/preferences', {
      preferences: '',
    });
    cy.intercept('GET', '**/customers/me/chat/suggestions', {
      suggestions: [],
    });
    cy.intercept('GET', '**/customers/me/chat/profile-suggestions', {
      suggestions: [],
    });
    cy.intercept('GET', '**/customers/me/chat/messages', []);
    cy.intercept('GET', '**/customers/me/chat/interests', []);
    cy.intercept('GET', '**/customers/me/chat/profile', {
      sport: 'Pular',
      experience: 'Pular',
      goal: 'Pular',
      budget: 'Pular',
    });
    cy.visit('/entrar');
    cy.get('input[name="email"]').type('ana.demo@cohida.test');
    cy.get('input[name="password"]').type('Demo@123', {
      log: false,
    });
    cy.contains('button[type="submit"]', 'Entrar').click();
    cy.location('pathname').should('eq', '/');
  });

  it(
    [
      'mantém a posição do botão e mostra',
      'a pergunta sugerida enquanto',
      'espera',
    ].join(' '),
    () => {
      cy.intercept('POST', '**/customers/me/chat/messages', {
        delay: 1500,
        body: { id: 1, content: 'Resposta simulada.' },
      });
      cy.get('[aria-label="Abrir assistente coHida"]').then(($button) => {
        const before = $button[0].getBoundingClientRect();
        cy.wrap($button).click();
        cy.get('[aria-expanded="true"]')
          .last()
          .then(($opened) => {
            const after = $opened[0].getBoundingClientRect();
            expect(after.x).to.equal(before.x);
            expect(after.y).to.equal(before.y);
          });
      });
      cy.get('[aria-label="Sua mensagem"]').then(($input) => {
        cy.get('[aria-label="Enviar mensagem"]').then(($button) => {
          expect($button[0].getBoundingClientRect().height).to.equal(
            $input[0].getBoundingClientRect().height,
          );
        });
      });
      cy.contains('button', 'Quero começar a correr').click();
      cy.contains('p', 'Quero começar a correr').should('be.visible');
      cy.contains('Pensando...').should('be.visible');
      cy.contains('Resposta simulada.').should('be.visible');
    },
  );

  it('permite tentar novamente uma pergunta que falhou', () => {
    let attempts = 0;
    cy.intercept('POST', '**/customers/me/chat/messages', (request) => {
      attempts += 1;
      request.reply(
        attempts === 1
          ? {
              statusCode: 502,
              body: { message: 'Falha simulada.' },
            }
          : {
              body: {
                id: 2,
                content: 'Resposta após nova tentativa.',
              },
            },
      );
    });
    cy.get('[aria-label="Abrir assistente coHida"]').click();
    cy.contains('button', 'Quero começar a correr').click();
    cy.contains('Falha simulada.').should('be.visible');
    cy.contains('button', 'Tentar novamente').click();
    cy.contains('Resposta após nova tentativa.').should('be.visible');
    cy.contains('button', 'Tentar novamente').should('not.exist');
  });

  it('mostra o produto recomendado e abre sua página', () => {
    cy.intercept('POST', '**/customers/me/chat/messages', {
      body: {
        id: 3,
        content: 'Confira este produto.',
        products: [
          {
            id: 7,
            slug: 'tenis-exemplo',
            name: 'Tênis Exemplo',
            brand: 'coHida',
            imageUrl: null,
            priceCents: 15000,
          },
        ],
      },
    });
    cy.get('[aria-label="Abrir assistente coHida"]').click();
    cy.contains('button', 'Quero começar a correr').click();
    cy.contains('a', 'Tênis Exemplo').should('contain', '150,00').click();
    cy.location('pathname').should('eq', '/produtos/tenis-exemplo');
  });
});
