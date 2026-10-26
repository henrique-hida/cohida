import {
  addFirstAvailableProductToCart,
  expireAllCartReservations,
  loginAsCustomer,
} from "./helpers";

it("6) remove pela interface os itens cuja reserva expirou e desabilita o checkout", () => {
  loginAsCustomer("ana.demo@cohida.test");
  addFirstAvailableProductToCart();
  expireAllCartReservations();
  cy.visit("/carrinho");
  cy.contains("Alguns itens foram removidos porque a reserva expirou.").should(
    "be.visible",
  );
  cy.contains("button", "Ir para o checkout").should("be.disabled");
});
