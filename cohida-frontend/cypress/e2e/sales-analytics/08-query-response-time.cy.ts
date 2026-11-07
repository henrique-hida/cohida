import { expectChartValue, prepare, visitAnalytics } from "./helpers";

it("8) responde à consulta acionada pela tela em até um segundo", () => {
  prepare();
  visitAnalytics();
  let durationMs: number | undefined;
  cy.intercept("GET", "**/api/admin/analytics/sales?*", (request) => {
    const startedAt = performance.now();
    request.on("response", () => {
      durationMs = performance.now() - startedAt;
    });
  }).as("timedSales");
  cy.get('button[aria-label="Limpar filtro de categorias"]').click();
  cy.get('button[aria-label="Filtrar análises por categoria"]').click();
  cy.contains("label", "Análise teste A").click();
  cy.wait("@timedSales");
  cy.then(() =>
    expect(durationMs, "duração da requisição da tela em ms")
      .to.be.a("number")
      .and.at.most(1000),
  );
  cy.get('button[aria-label="Filtrar análises por categoria"]').click();
  expectChartValue("jan", "Análise teste A", "90,00");
});
