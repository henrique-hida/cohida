/// <reference types="cypress" />

const apiBaseUrl = String(
  Cypress.expose('apiBaseUrl') ?? 'http://localhost:8080/api',
);
const adminCredentials = {
  email: 'e2e.admin@cohida.test',
  password: 'Cypress@123',
};

type Session = { accessToken: string };
type Product = {
  id: number;
  variants: Array<{ id: number }>;
};
type ExpiredCartItem = { id: number };

export function apiLogin(email: string, password = 'Demo@123') {
  return cy
    .request<Session>({
      body: { email, password },
      method: 'POST',
      url: `${apiBaseUrl}/auth/login`,
    })
    .its('body.accessToken');
}

function apiHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

function authenticateInBrowser(email: string, password = 'Demo@123') {
  cy.visit('/entrar');
  cy.get('input[name="email"]').clear().type(email);
  cy.get('input[name="password"]').clear().type(password);
  cy.get('form').contains('button', 'Entrar').click();
  return cy.location('pathname').should('not.eq', '/entrar');
}

function clearExpiredCartItems(accessToken: string) {
  return cy
    .request<ExpiredCartItem[]>({
      headers: apiHeaders(accessToken),
      url: `${apiBaseUrl}/customers/me/cart/expired-items`,
    })
    .then(({ body: expiredItems }) => {
      expiredItems.forEach((item) => {
        cy.request({
          headers: apiHeaders(accessToken),
          method: 'POST',
          url: [
            String(apiBaseUrl),
            '/customers/me/cart/expired-ite',
            'ms/',
            String(item.id),
            '/acknowledge',
          ].join(''),
        });
      });
    });
}

export function loginAsCustomer(email: string, password = 'Demo@123') {
  return replenishCatalogThroughAdmin()
    .then(() =>
      apiLogin(email, password).then((accessToken) =>
        clearExpiredCartItems(accessToken)
          .then(() =>
            cy.request({
              method: 'DELETE',
              url: `${apiBaseUrl}/customers/me/cart/coupon`,
              headers: apiHeaders(accessToken),
            }),
          )
          .then(() => authenticateInBrowser(email, password)),
      ),
    )
    .then(() => cy.visit('/'))
    .then(() => cy.location('pathname').should('eq', '/'))
    .then(() =>
      cy.get('button[aria-label="Menu da conta"]').should('be.visible'),
    );
}

function replenishCatalogThroughAdmin() {
  return apiLogin(adminCredentials.email, adminCredentials.password).then(
    (accessToken) =>
      cy
        .request<Product[]>({
          headers: apiHeaders(accessToken),
          url: `${apiBaseUrl}/admin/products`,
        })
        .then(({ body: products }) => {
          products.forEach((product) =>
            product.variants.forEach((variant) =>
              cy.request({
                body: { stockQuantity: 50 },
                headers: apiHeaders(accessToken),
                method: 'PATCH',
                url: [
                  String(apiBaseUrl),
                  '/admin/products/',
                  String(product.id),
                  '/variants/',
                  String(variant.id),
                  '/stock',
                ].join(''),
              }),
            ),
          );
        }),
  );
}

export function loginAsAdmin() {
  return authenticateInBrowser(
    adminCredentials.email,
    adminCredentials.password,
  )
    .then(() => cy.visit('/admin/clientes'))
    .then(() => cy.location('pathname').should('eq', '/admin/clientes'));
}

export function expireAllCartReservations() {
  return apiLogin(adminCredentials.email, adminCredentials.password).then(
    (accessToken) =>
      cy.request({
        headers: apiHeaders(accessToken),
        method: 'POST',
        url: `${apiBaseUrl}/admin/cart-reservations/expire`,
      }),
  );
}

export function addFirstAvailableProductToCart(
  productName?: string,
): Cypress.Chainable {
  return cy
    .visit('/carrinho')
    .contains('h1', 'Carrinho')
    .should('be.visible')
    .then(() => clearCart())
    .then(() => {
      cy.visit('/produtos');
      if (productName) {
        cy.contains('[data-slot="card"]', productName)
          .contains('button', 'Adicionar')
          .should('not.be.disabled')
          .click();
      } else {
        cy.contains('button', 'Adicionar')
          .filter(':not(:disabled)')
          .first()
          .click();
      }
    })
    .get('[aria-label^="Carrinho com"]')
    .should('not.have.attr', 'aria-label', 'Carrinho com 0 itens');
}

export function startCheckoutWithFirstAvailableProduct(
  productName?: string,
): Cypress.Chainable {
  return addFirstAvailableProductToCart(productName)
    .then(() => cy.visit('/carrinho'))
    .then(() => acknowledgeExpiredItems())
    .then(() => cy.get('a[href="/checkout"]').click())
    .then(() => cy.location('pathname').should('eq', '/checkout'));
}

function acknowledgeExpiredItems(): Cypress.Chainable {
  return cy.get('body').then(($body) => {
    const $acknowledgeButtons = $body.find('button').filter((_, button) => {
      return button.textContent?.trim() === 'Entendi';
    });
    if (!$acknowledgeButtons.length) return undefined;

    const remainingItems = $acknowledgeButtons.length - 1;
    return cy
      .wrap($acknowledgeButtons.first())
      .click()
      .get('body')
      .should(($updatedBody) => {
        expect(
          $updatedBody.find('button').filter((_, button) => {
            return button.textContent?.trim() === 'Entendi';
          }).length,
        ).to.equal(remainingItems);
      })
      .then(() => acknowledgeExpiredItems());
  });
}

export function clearCart(): Cypress.Chainable {
  return cy.get('body').then(($body) => {
    const $removeButtons = $body.find('button[aria-label^="Remover "]');
    if (!$removeButtons.length) return undefined;

    const remainingItems = $removeButtons.length - 1;
    return cy
      .wrap($removeButtons.first())
      .click()
      .get('body')
      .should(($updatedBody) => {
        expect(
          $updatedBody.find('button[aria-label^="Remover "]').length,
        ).to.equal(remainingItems);
      })
      .then(() => clearCart());
  });
}
