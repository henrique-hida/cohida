import {
  api,
  expectChartValue,
  login,
  prepare,
  selectCategories,
  visitAnalytics,
  year,
} from "./helpers";

type Order = { id: number; couponCode: string };
afterEach(() => {
  cy.task("prepareSalesAnalytics");
});

it("6) reflete uma compra que passa a entregue na consulta seguinte", () => {
  prepare();
  visitAnalytics();
  selectCategories("Análise teste B");
  expectChartValue("mar", "Análise teste B", "0,00");
  login().then((token) => {
    cy.request<Order[]>({
      url: `${api}/admin/orders`,
      headers: { Authorization: `Bearer ${token}` },
    }).then(({ body }) => {
      const order = body.find(
        (item) => item.couponCode === `ANALYTICS-DEMO-MAR-${year}`,
      );
      expect(order, "pedido preparado para o teste").to.exist;
      cy.visit(`/admin/pedidos/${order!.id}`);
    });
  });
  cy.contains("button", "Confirmar entrega").click();
  cy.get('[role="dialog"]').contains("button", "Confirmar entrega").click();
  cy.contains("Entrega confirmada.").should("be.visible");
  cy.visit("/admin/analises");
  cy.wait("@sales");
  selectCategories("Análise teste B");
  expectChartValue("mar", "Análise teste B", "200,00");
});
