import {
  confirmOrder,
  loginAsCustomer,
  startCheckoutWithFirstAvailableProduct,
} from "../helpers/purchase-flows-ui";

it("finaliza uma compra usando endereço e cartão já cadastrados", () => {
  loginAsCustomer("bruno.demo@cohida.test");
  startCheckoutWithFirstAvailableProduct();
  cy.get('input[name="delivery-address"]').first().should("be.checked");
  cy.get('input[type="checkbox"]').first().should("be.checked");
  confirmOrder();
  cy.visit("/pedidos");
  cy.visit("/conta?secao=orders");
  cy.get('a[href^="/pedidos/"]').should("have.length.at.least", 1);
});
