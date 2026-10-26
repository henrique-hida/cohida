import {
  confirmOrder,
  loginAsCustomer,
  seedCard,
  startCheckoutWithFirstAvailableProduct,
  totalCents,
} from "../helpers/purchase-flows-ui";

it("divide o pagamento entre cartões com pelo menos R$ 10,00 em cada um", () => {
  const cardLabel = `Cartão dividido ${Date.now()}`;
  seedCard("clara.demo@cohida.test", cardLabel);
  loginAsCustomer("clara.demo@cohida.test");
  startCheckoutWithFirstAvailableProduct();
  cy.contains("label", cardLabel).find('input[type="checkbox"]').check();
  totalCents().then((total) => {
    cy.get('input[type="number"]').first().type("10.00");
    cy.get('input[type="number"]')
      .last()
      .type(((total - 1000) / 100).toFixed(2));
  });
  confirmOrder();
});
