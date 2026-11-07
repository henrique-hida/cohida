import {
  expectChartValue,
  prepare,
  selectCategories,
  visitAnalytics,
} from "./helpers";

it("2) compara duas categorias, incluindo produto em ambas", () => {
  prepare();
  visitAnalytics();
  selectCategories("Análise teste A", "Análise teste B");
  cy.get(".recharts-area").should("have.length", 2);
  cy.contains("Análise teste A").should("be.visible");
  cy.contains("Análise teste B").should("be.visible");
  expectChartValue("jan", "Análise teste A", "90,00");
  expectChartValue("jan", "Análise teste B", "270,00");
});
