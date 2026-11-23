describe('Preferências do assistente', () => {
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
      sport: null,
      experience: null,
      goal: null,
      budget: null,
    });
    cy.visit('/entrar');
    cy.get('input[name="email"]').type('ana.demo@cohida.test');
    cy.get('input[name="password"]').type('Demo@123', { log: false });
    cy.contains('button[type="submit"]', 'Entrar').click();
    cy.location('pathname').should('eq', '/');
  });

  it('salva uma resposta e apresenta a pergunta seguinte', () => {
    cy.intercept('PUT', '**/customers/me/chat/interests', (request) => {
      expect(
        request.body.map((item: { sport: string }) => item.sport),
      ).to.deep.equal(['Judô', 'Corrida']);
      request.reply({ body: request.body });
    }).as('saveProfile');
    cy.get('[aria-label="Abrir assistente coHida"]').click();
    cy.get('[aria-label="Preferências esportivas"]').click();
    cy.contains('Quais atividades fazem parte da sua rotina?').should(
      'be.visible',
    );
    cy.contains('button', 'Judô').click();
    cy.contains('button', 'Corrida').click();
    cy.contains('button', 'Continuar').click();
    cy.wait('@saveProfile');
    cy.contains('O que você procura para judô?').should('be.visible');
    cy.contains('Judô').should('be.visible');
  });

  it('mantém a pergunta quando não consegue salvar a resposta', () => {
    cy.intercept('PUT', '**/customers/me/chat/interests', { statusCode: 500 });
    cy.get('[aria-label="Abrir assistente coHida"]').click();
    cy.get('[aria-label="Preferências esportivas"]').click();
    cy.contains('button', 'Judô').click();
    cy.contains('button', 'Continuar').click();
    cy.contains('Não foi possível salvar suas preferências.').should(
      'be.visible',
    );
    cy.contains('Quais atividades fazem parte da sua rotina?').should(
      'be.visible',
    );
  });
});
