import {
  loginAsCustomer,
  startCheckoutWithFirstAvailableProduct,
} from './helpers';
import { seedCard } from '../helpers/purchase-flows-ui';

it(
  [
    '5) mostra pela interface que',
    'cartão recusado não aprova nem',
    'baixa a compra',
  ].join(' '),
  () => {
    const cardLabel = `Cartão recusado ${Date.now()}`;
    seedCard(
      'clara.demo@cohida.test',
      cardLabel,
      '4000000000000002',
      `declined-e2e-${Date.now()}`,
    );
    loginAsCustomer('clara.demo@cohida.test');
    startCheckoutWithFirstAvailableProduct();
    cy.contains('label', cardLabel).find('input[type="checkbox"]').check();
    cy.contains('button', 'Confirmar pedido').click();
    cy.contains('h1', 'Pagamento recusado').should('be.visible');
    cy.visit('/pedidos');
    cy.get('a[href^="/pedidos/"]').should('exist');
    cy.contains('Reprovado').should('be.visible');
    cy.visit('/carrinho');
    cy.contains('Seu carrinho está vazio').should('be.visible');
    cy.visit('/produtos');
    cy.get('a[href^="/produtos/"]').first().click();
    cy.contains('button', 'Adicionar ao carrinho').should('be.enabled');
  },
);
