/// <reference types="cypress" />
const demoStorageKey = "cohida-demo-commerce-v1";

function addDemo() {
  cy.visit("/");
  cy.get('[aria-label="Menu do perfil"]').click();
  cy.contains("button", "Adicionar demo").click();
  cy.window().should((window) => {
    const state = JSON.parse(
      window.localStorage.getItem(demoStorageKey) ?? "{}",
    );
    expect(state.customer?.id).to.equal("customer-henrique");
  });
}

function registerCustomer() {
  cy.visit("/entrar");
  cy.contains("button", "Criar conta").click();
  cy.get('input[name="name"]').type("Cliente Cypress");
  cy.get('input[name="cpf"]').type("12345678909");
  cy.get('input[name="birthDate"]').type("1995-05-15");
  cy.get('input[name="phone"]').type("11999991234");
  cy.get('input[name="email"]').type("cliente.cypress@cohida.test");
  cy.get('input[name="password"]').type("Cypress@123");
  cy.get('input[name="passwordConfirmation"]').type("Cypress@123");
  cy.contains("button", "Continuar").click();

  cy.get('input[name="deliveryLabel"]').clear().type("Casa Cypress");
  cy.get('input[name="deliveryPostalCode"]').type("04118010");
  cy.get('input[name="deliveryStreet"]').type("Rua do Teste");
  cy.get('input[name="deliveryNumber"]').type("42");
  cy.get('input[name="deliveryNeighborhood"]').type("Vila Cypress");
  cy.get('input[name="deliveryCity"]').type("São Paulo");
  cy.get('input[name="deliveryState"]').type("SP");
  cy.get('input[name="deliveryCountry"]').clear().type("Brasil");
  cy.contains('form button[type="submit"]', "Criar conta").click();
  cy.contains("h1", "Olá, Cliente").should("be.visible");
}

describe("fluxos de compra", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.viewport(1440, 900);
    cy.intercept("GET", "https://viacep.com.br/ws/*/json/", {
      bairro: "Vila Cypress",
      localidade: "São Paulo",
      logradouro: "Rua do Teste",
      uf: "SP",
    });
  });

  it("cadastra uma conta com o endereço de entrega reutilizado na cobrança", () => {
    registerCustomer();

    cy.contains("button", "Endereços").click();
    cy.contains("Casa Cypress").should("be.visible");
    cy.contains("Cobrança").should("be.visible");
  });

  it("compra os itens adicionados ao carrinho", () => {
    registerCustomer();
    cy.visit("/produtos/bola-strike-pro");
    cy.contains("button", "Adicionar ao carrinho").click();
    cy.get('[aria-label="Carrinho com 1 itens"]').click();
    cy.contains("Bola Strike Pro").should("be.visible");
    cy.contains("a", "Ir para o checkout").click();
    cy.contains("h1", "Finalizar pedido").should("be.visible");
    cy.contains("button", "Confirmar pedido").click();
    cy.contains("h1", "Pedido em processamento").should("be.visible");
    cy.contains(/R\$\s*169,80/).should("be.visible");

    cy.window().then((window) => {
      const state = JSON.parse(
        window.localStorage.getItem(demoStorageKey) ?? "{}",
      );
      expect(state.cartItems).to.have.length(0);
      expect(state.orders).to.have.length(1);
      expect(state.orders[0]).to.deep.include({
        discountCents: 0,
        shippingCents: 1990,
        subtotalCents: 14990,
        totalCents: 16980,
      });
    });
  });

  it("compra agora apenas o item selecionado, permite novo endereço, cupom e pagamentos combinados", () => {
    addDemo();
    cy.visit("/produtos/bola-strike-pro");
    cy.contains("button", "Comprar agora").click();

    cy.contains("h1", "Finalizar pedido").should("be.visible");
    cy.contains("Bola Strike Pro").should("be.visible");
    cy.contains("Tênis Velocity Runner").should("not.exist");

    cy.contains("button", "Adicionar endereço").click();
    cy.get('input[name="label"]').type("Treino");
    cy.get('input[name="postalCode"]').type("01001000");
    cy.get('input[name="number"]').type("100");
    cy.get('input[name="street"]').type("Praça da Sé");
    cy.get('input[name="neighborhood"]').type("Sé");
    cy.get('input[name="city"]').type("São Paulo");
    cy.get('input[name="state"]').type("SP");
    cy.contains("button", "Usar este endereço").click();
    cy.contains("label", "Treino")
      .find('input[type="radio"]')
      .should("be.checked");

    cy.contains("button", "Ver cupons disponíveis").click();
    cy.contains("button", "COHIDA15").click();
    cy.get("#coupon").should("have.value", "COHIDA15");
    cy.contains("button", "Aplicar").click();
    cy.get('[aria-label="Remover cupom COHIDA15"]').should("be.visible");
    cy.get('[aria-label="Remover cupom COHIDA15"]').click();
    cy.get('[aria-label="Remover cupom COHIDA15"]').should("not.exist");

    cy.contains("button", "Ver cupons disponíveis").click();
    cy.contains("button", "COHIDA15").click();
    cy.contains("button", "Aplicar").click();
    cy.contains("label", "Pix").find('input[type="checkbox"]').check();
    cy.contains("label", "Valor para Visa").find("input").type("100");
    cy.contains("label", "Valor para Pix").find("input").type("54.8");
    cy.contains("button", "Confirmar pedido").click();
    cy.contains("h1", "Pedido em processamento").should("be.visible");
    cy.contains(/R\$\s*154,80/).should("be.visible");

    cy.window().then((window) => {
      const state = JSON.parse(
        window.localStorage.getItem(demoStorageKey) ?? "{}",
      );
      expect(state.buyNowItem).to.equal(null);
      expect(state.cartItems).to.have.length(3);
      expect(state.orders[0]).to.deep.include({
        discountCents: 1500,
        shippingCents: 1990,
        subtotalCents: 14990,
        totalCents: 15480,
      });
      expect(
        state.cartItems.map((item: { productId: string }) => item.productId),
      ).to.include("velocity-runner");
    });
  });

  it("registra os dados de despacho de uma troca autorizada", () => {
    addDemo();
    cy.visit("/trocas");
    cy.contains("EX-2026-014").should("be.visible");
    cy.contains("button", "Informar despacho").click();
    cy.contains("Dados do despacho").should("be.visible");
    cy.get('input[name="carrier"]').type("Correios");
    cy.get('input[name="trackingCode"]').type("AB123456789BR");
    cy.get('input[name="postedAt"]').clear().type("2026-08-23");
    cy.get('input[name="notes"]').type("Postado na agência central");
    cy.contains("button", "Confirmar despacho").click();

    cy.contains("Item despachado").should("be.visible");
    cy.contains("Correios · AB123456789BR · Postado em 23/08/2026").should(
      "be.visible",
    );

    cy.window().then((window) => {
      const state = JSON.parse(
        window.localStorage.getItem(demoStorageKey) ?? "{}",
      );
      const exchange = state.exchanges.find(
        (item: { id: string }) => item.id === "EX-2026-014",
      );
      expect(exchange.status).to.equal("sent");
      expect(exchange.dispatch).to.deep.include({
        carrier: "Correios",
        postedAt: "2026-08-23",
        trackingCode: "AB123456789BR",
      });
    });
  });
});
