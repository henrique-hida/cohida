import { prepare, selectCategories, visitAnalytics } from "./helpers";

it("3) exibe as linhas, meses e escala monetária", () => {
  prepare();
  visitAnalytics();
  selectCategories("Análise teste A", "Análise teste B");
  cy.get(".recharts-surface").should("be.visible");
  cy.get(".recharts-area-curve").should("have.length", 2);
  cy.get(".recharts-wrapper svg text")
    .invoke("text")
    .should("match", /jan/i)
    .and("match", /R\$/);
  cy.get(".recharts-legend-wrapper")
    .should("contain.text", "Análise teste A")
    .and("contain.text", "Análise teste B");
});
