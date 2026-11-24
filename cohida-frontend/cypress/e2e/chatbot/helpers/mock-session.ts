export function mockCustomerSession() {
  const payload = btoa(
    JSON.stringify({ sub: '42', role: 'CUSTOMER', exp: 4102444800 }),
  );
  cy.intercept('POST', '**/auth/login', {
    accessToken: `e30.${payload}.signature`,
    sessionId: '00000000-0000-4000-8000-000000000042',
    role: 'CUSTOMER',
    customerName: 'Cliente de teste',
  });
  cy.intercept('GET', '**/customers/me', {
    id: 42,
    name: 'Cliente de teste',
    email: 'cliente@teste.local',
    cpf: '',
    phone: '',
    birthDate: '',
    addresses: [],
  });
  cy.intercept('GET', '**/customers/me/cart', {
    items: [],
    subtotalCents: 0,
    discountCents: 0,
    shippingCents: 0,
    totalCents: 0,
  });
  cy.intercept('GET', '**/customers/me/notifications', []);
  cy.intercept('GET', '**/customers/me/chat/recommendations', []);
  for (const resource of [
    'cards',
    'orders',
    'orders/returns',
    'coupons',
    'cart/expired-items',
  ]) {
    cy.intercept('GET', `**/customers/me/${resource}`, []);
  }
  cy.intercept('GET', '**/products/search?*', {
    products: [],
    total: 0,
    page: 0,
    size: 24,
  });
}
