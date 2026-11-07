import { seedCard } from "../helpers/purchase-flows-ui";
import { loginAsCustomer, startCheckoutWithFirstAvailableProduct } from "./helpers";

it("2) bloqueia pela interface dois cartões quando um deles recebe menos de R$ 10,00", () => {
  const cardLabel = `Cartão mínimo ${Date.now()}`;
  seedCard("ana.demo@cohida.test", cardLabel);
  loginAsCustomer("ana.demo@cohida.test");
  startCheckoutWithFirstAvailableProduct();
  cy.contains("label", cardLabel).find('input[type="checkbox"]').check();
  cy.get('input[type="number"]').first().clear().type("5").blur();
  cy.contains("button", "Confirmar pedido").click();
  cy.contains("Em pagamentos combinados, informe valores de ao menos R$ 10,00").should("be.visible");
});
