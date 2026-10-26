import {
  addAddress,
  addCard,
  confirmOrder,
  loginAsCustomer,
  startCheckoutWithFirstAvailableProduct,
} from "../helpers/purchase-flows-ui";

it("incorpora endereço e cartão criados no checkout ao perfil", () => {
  const id = Date.now();
  const addressLabel = `Casa E2E ${id}`;
  const cardLabel = `Cartão E2E ${id}`;
  loginAsCustomer("clara.demo@cohida.test");
  startCheckoutWithFirstAvailableProduct();
  addAddress(addressLabel);
  addCard(cardLabel);
  confirmOrder();
  cy.visit("/conta?secao=addresses");
  cy.contains(addressLabel).should("be.visible");
  cy.visit("/conta?secao=cards");
  cy.contains(cardLabel).should("be.visible");
});
