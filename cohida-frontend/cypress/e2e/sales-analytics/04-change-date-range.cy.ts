import {
  expectChartValue,
  prepare,
  selectCategories,
  visitAnalytics,
  year,
} from "./helpers";

it("4) altera a data inicial e atualiza o gráfico", () => {
  prepare();
  visitAnalytics();
  selectCategories("Análise teste A");
  expectChartValue("jan", "Análise teste A", "90,00");
  cy.get('button[aria-label="Selecionar data de início"]').click();
  cy.get(`[data-day="16/01/${year}"]`).first().click();
  cy.wait("@sales");
  expectChartValue("jan", "Análise teste A", "0,00");
  cy.get('button[aria-label="Selecionar data de início"]').should(
    "contain.text",
    `16/01/${year}`,
  );
  cy.get('button[aria-label="Selecionar data de fim"]').should(
    "contain.text",
    `31/12/${year}`,
  );
});
