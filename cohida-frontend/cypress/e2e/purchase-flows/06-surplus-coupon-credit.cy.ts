import {
  confirmOrder,
  createCoupon,
  loginAsCustomer,
  startCheckoutWithFirstAvailableProduct,
  totalCents,
} from "../helpers/purchase-flows-ui";

it("emite cupom de troca quando os cupons superam o valor da compra", () => {
  const code = `E2E-SALDO-${Date.now()}`;
  createCoupon(code, "exchange", "500.00");
  loginAsCustomer("clara.demo@cohida.test");
  startCheckoutWithFirstAvailableProduct();
  totalCents().then((total) => {
    const expectedCredit = new Intl.NumberFormat("pt-BR", {
      currency: "BRL",
      style: "currency",
    }).format((50000 - total) / 100);

    cy.get("#coupon").type(code);
    cy.contains(code).should("be.visible");
    confirmOrder();
    cy.contains("Cupom de troca emitido")
      .parent()
      .should("contain.text", expectedCredit);
  });
});
