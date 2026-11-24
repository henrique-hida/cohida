import { mockCustomerSession } from './helpers/mock-session';

describe('Preferências do assistente', () => {
  beforeEach(() => {
    mockCustomerSession();
    cy.intercept('GET', '**/categories', [
      { id: 1, name: 'Corrida', slug: 'running', description: '' },
      { id: 2, name: 'Artes marciais', slug: 'martial-arts', description: '' },
    ]);
    cy.intercept('GET', '**/customers/me/chat/profile-suggestions', {
      suggestions: [],
    });
    cy.intercept('GET', '**/customers/me/chat/messages', []);
    cy.intercept('GET', '**/customers/me/chat/category-interests', []);
    cy.intercept('GET', '**/customers/me/chat/experience-options', [
      'Iniciante',
      'Intermediário',
      'Avançado',
    ]);
    cy.visit('/entrar');
    cy.get('input[name="email"]').type('ana.demo@cohida.test');
    cy.get('input[name="password"]').type('Demo@123', { log: false });
    cy.contains('button[type="submit"]', 'Entrar').click();
    cy.location('pathname').should('eq', '/');
  });

  function openPreferences() {
    cy.get('[aria-label="Abrir assistente coHida"]').click();
    cy.get('[aria-label="Preferências de categorias"]').click();
  }

  it('adiciona, edita e exclui uma categoria com experiência', () => {
    let saved: { categoryId: number; name: string; experience: string }[] = [];
    cy.intercept('GET', '**/customers/me/chat/category-interests', (request) =>
      request.reply({ body: saved }),
    );
    cy.intercept(
      'PUT',
      '**/customers/me/chat/category-interests',
      (request) => {
        saved = request.body;
        request.reply({ body: saved });
      },
    ).as('saveInterests');
    openPreferences();
    cy.contains('button', 'Adicionar preferência').click();
    cy.contains('Selecione uma categoria e sua experiência.').should(
      'not.exist',
    );
    cy.contains('button', 'Salvar preferência').click();
    cy.contains('Selecione uma categoria e sua experiência.').should(
      'be.visible',
    );
    cy.contains('button', 'Cancelar').click();
    cy.contains('button', 'Adicionar preferência').click();
    cy.contains('Selecione uma categoria e sua experiência.').should(
      'not.exist',
    );
    cy.get('[aria-label="Categoria"]').type('cor');
    cy.contains('[role="option"]', 'Corrida').click();
    cy.get('[aria-label="Experiência"]').click();
    cy.contains('[role="option"]', 'Iniciante').click();
    cy.contains('button', 'Salvar preferência').click();
    cy.wait('@saveInterests')
      .its('request.body.0.experience')
      .should('eq', 'Iniciante');
    cy.contains('button', 'Limpar preferências').should('not.exist');
    cy.contains('button', 'Adicionar preferência').click();
    cy.get('[aria-label="Editar Corrida"]').should('be.visible');
    cy.get('[aria-label="Categoria"]').should('be.visible');
    cy.contains('button', 'Cancelar').should('have.class', 'bg-muted').click();
    cy.get('[aria-label="Editar Corrida"]').click();
    cy.get('[aria-label="Excluir Corrida"]').should('be.visible');
    cy.get('[aria-label="Experiência"]').click();
    cy.contains('[role="option"]', 'Avançado').click();
    cy.contains('button', 'Salvar preferência').click();
    cy.wait('@saveInterests')
      .its('request.body.0.experience')
      .should('eq', 'Avançado');
    cy.get('[aria-label="Excluir Corrida"]').click();
    cy.get('[role="dialog"]').contains('button', 'Excluir').click();
    cy.wait('@saveInterests').its('request.body').should('deep.equal', []);
    cy.contains('Você ainda não adicionou categorias').should('be.visible');
  });

  it('permite cancelar uma nova preferência', () => {
    openPreferences();
    cy.contains('button', 'Adicionar preferência').click();
    cy.contains('button', 'Cancelar').click();
    cy.contains('button', 'Adicionar preferência').should('be.visible');
    cy.get('[aria-label="Categoria"]').should('not.exist');
  });

  it('informa quando não consegue salvar uma preferência', () => {
    cy.intercept('PUT', '**/customers/me/chat/category-interests', {
      statusCode: 500,
    });
    openPreferences();
    cy.contains('button', 'Adicionar preferência').click();
    cy.get('[aria-label="Categoria"]').type('cor');
    cy.contains('[role="option"]', 'Corrida').click();
    cy.get('[aria-label="Experiência"]').click();
    cy.contains('[role="option"]', 'Iniciante').click();
    cy.contains('button', 'Salvar preferência').click();
    cy.contains('Não foi possível salvar suas preferências.').should(
      'be.visible',
    );
  });

  it('inicia um novo chat após confirmação', () => {
    cy.intercept('GET', '**/customers/me/chat/messages', [
      {
        id: 1,
        question: 'Minha pergunta anterior',
        response: 'Minha resposta',
        useful: null,
        products: [],
      },
    ]);
    cy.intercept('DELETE', '**/customers/me/chat/messages', {
      statusCode: 204,
    }).as('clearHistory');
    cy.get('[aria-label="Abrir assistente coHida"]').click();
    cy.contains('Minha pergunta anterior').should('be.visible');
    cy.contains('button', 'Novo chat').click();
    cy.get('[role="dialog"]').contains('button', 'Novo chat').click();
    cy.wait('@clearHistory');
    cy.contains('Minha pergunta anterior').should('not.exist');
  });
});
