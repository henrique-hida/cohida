import { login, prepare, visitAnalytics } from "./helpers";

it("7) permite a análise ao administrador e nega ao cliente", () => {
  prepare();
  visitAnalytics();
  cy.contains("Análises de vendas").should("be.visible");
  login("ana.demo@cohida.test", "Demo@123").then((token) => {
    cy.visit("/admin/analises", {
      onBeforeLoad(win) {
        win.localStorage.setItem("cohida-access-token", token);
      },
    });
    cy.location("pathname").should("eq", "/entrar");
    cy.contains("Análises de vendas").should("not.exist");
  });
});
