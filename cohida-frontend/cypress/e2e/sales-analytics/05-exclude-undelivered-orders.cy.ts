import {
  expectChartValue,
  prepare,
  selectCategories,
  visitAnalytics,
} from "./helpers";

it("5) exclui a compra em transporte do histórico", () => {
  prepare();
  visitAnalytics();
  selectCategories("Análise teste B");
  expectChartValue("mar", "Análise teste B", "0,00");
});
