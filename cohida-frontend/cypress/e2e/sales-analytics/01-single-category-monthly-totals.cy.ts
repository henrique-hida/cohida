import {
  expectChartValue,
  prepare,
  selectCategories,
  visitAnalytics,
} from "./helpers";

it("1) consulta os totais mensais de uma categoria", () => {
  prepare();
  visitAnalytics();
  selectCategories("Análise teste A");
  cy.get(".recharts-area").should("have.length", 1);
  expectChartValue("jan", "Análise teste A", "90,00");
  expectChartValue("fev", "Análise teste A", "100,00");
  expectChartValue("mar", "Análise teste A", "0,00");
  expectChartValue("abr", "Análise teste A", "100,01");
});
