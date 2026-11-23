import { clearCart, loginAsAdmin, loginAsCustomer } from './helpers';

it('permite escolher a variação que será devolvida', () => {
  loginAsCustomer('clara.demo@cohida.test');
  cy.visit('/carrinho');
  clearCart();
  cy.visit('/produtos/bola-strike-pro');
  cy.contains('button', '4').click();
  cy.contains('button', 'Adicionar ao carrinho').click();
  cy.contains('button', '5').click();
  cy.contains('button', 'Adicionar ao carrinho').click();
  cy.visit('/carrinho');
  cy.get('a[href="/checkout"]').click();
  cy.contains('button', 'Confirmar pedido').click();
  cy.contains('Número do pedido')
    .next()
    .invoke('text')
    .then((number) => {
      const orderId = number.replace('#', '').trim();
      loginAsAdmin();
      cy.visit(`/admin/pedidos/${orderId}`);
      cy.get('input[aria-label="Código de rastreio"]').type('TESTE-TROCA');
      cy.contains('button', 'Despachar').click();
      cy.contains('button', 'Confirmar entrega').click();
      cy.get('[role="dialog"]').contains('button', 'Confirmar entrega').click();

      loginAsCustomer('clara.demo@cohida.test');
      cy.visit(`/conta?secao=exchanges&pedido=${orderId}`);
      cy.contains('label', 'Item').find('button[role="combobox"]').click();
      cy.get('[role="option"]').contains('Tamanho 4').click();
      cy.get('textarea[name="details"]').type('Variação tamanho 4.');
      cy.contains('button', 'Enviar solicitação').click();
      cy.contains('h2', 'Solicitação enviada').should('be.visible');
      cy.contains('button', 'Ver solicitações').click();
      cy.contains('p', /^Solicitação #/)
        .first()
        .invoke('text')
        .then((text) => {
          const requestId = text.replace('Solicitação #', '').trim();
          loginAsAdmin();
          cy.visit(`/admin/trocas/${requestId}`);
          cy.contains('Tamanho 4 · Quantidade: 1').should('be.visible');
          cy.contains('Variação tamanho 4.').should('be.visible');
        });
    });
});
