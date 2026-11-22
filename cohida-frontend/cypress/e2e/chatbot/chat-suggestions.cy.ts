describe('Sugestões personalizadas', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/customers/me/chat/preferences', {
      preferences: '',
    });
    cy.intercept('GET', '**/customers/me/chat/suggestions', {
      suggestions: [],
    });
    cy.visit('/entrar');
    cy.get('input[name="email"]').type('ana.demo@cohida.test');
    cy.get('input[name="password"]').type('Demo@123', {
      log: false,
    });
    cy.contains('button[type="submit"]', 'Entrar').click();
    cy.location('pathname').should('eq', '/');
  });

  it('atualiza as sugestões quando o cliente salva preferências', () => {
    cy.intercept('PUT', '**/customers/me/chat/preferences', {
      preferences: 'Judô para iniciantes',
    });
    cy.intercept('POST', '**/customers/me/chat/suggestions', {
      delay: 1500,
      body: {
        suggestions: ['Qual judogi escolher?', 'Como começar no judô?'],
      },
    });
    cy.get('[aria-label="Abrir assistente coHida"]').click();
    cy.contains('summary', 'Suas preferências').click();
    cy.get('[aria-label="Preferências esportivas"]').type(
      'Judô para iniciantes',
    );
    cy.contains('button', 'Salvar preferências').click();
    cy.get('[role="status"][aria-label="Preparando sugestões"]')
      .should('be.visible')
      .find('[data-slot="skeleton"]')
      .should('have.length', 5);
    cy.contains('button', 'Quero começar a correr').should('not.exist');
    cy.contains('button', 'Qual judogi escolher?').should('be.visible');
    cy.contains('button', 'Como começar no judô?').should('be.visible');
    cy.contains('button', 'Quero começar a correr').should('not.exist');
    cy.get('[role="status"][aria-label="Preparando sugestões"]').should(
      'not.exist',
    );
  });

  it('mantém as preferências e exibe um aviso útil se a geração falhar', () => {
    cy.intercept('PUT', '**/customers/me/chat/preferences', {
      preferences: 'Judô',
    });
    cy.intercept('POST', '**/customers/me/chat/suggestions', {
      statusCode: 502,
      body: {},
    });
    cy.get('[aria-label="Abrir assistente coHida"]').click();
    cy.contains('summary', 'Suas preferências').click();
    cy.get('[aria-label="Preferências esportivas"]').type('Judô');
    cy.contains('button', 'Salvar preferências').click();
    cy.contains(
      'O assistente não respondeu; mantive as sugestões disponíveis.',
    ).should('be.visible');
    cy.get('[aria-label="Preferências esportivas"]').should(
      'have.value',
      'Judô',
    );
    cy.contains('button', 'Quero começar a correr').should('be.visible');
    cy.contains('button', 'Gerar sugestões').should('be.visible');
  });
});
