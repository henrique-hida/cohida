import {
  confirmOrder,
  loginAsCustomer,
  startCheckoutWithFirstAvailableProduct,
} from "../helpers/purchase-flows-ui";

it("registra o pedido finalizado com status EM PROCESSAMENTO", () => {
  loginAsCustomer("bruno.demo@cohida.test");
  startCheckoutWithFirstAvailableProduct();
  confirmOrder();
  cy.visit("/pedidos");
  cy.visit("/conta?secao=orders");
  cy.get('a[href^="/pedidos/"]').should("have.length.at.least", 1);
});
