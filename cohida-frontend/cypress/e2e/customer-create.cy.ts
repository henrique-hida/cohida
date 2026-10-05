/// <reference types="cypress" />

const customer = {
  birthDate: "1995-05-15",
  cpf: "12345678909",
  email: "cliente.cypress@cohida.test",
  name: "Cliente Cypress",
  phone: "11999991234",
};

const adminToken =
  "eyJhbGciOiJub25lIn0.eyJyb2xlIjoiQURNSU4iLCJleHAiOjQxMDI0NDQ4MDB9.signature";
const customerToken =
  "eyJhbGciOiJub25lIn0.eyJyb2xlIjoiQ1VTVE9NRVIiLCJleHAiOjQxMDI0NDQ4MDB9.signature";

const deliveryAddress = {
  city: "São Paulo",
  country: "Brasil",
  label: "Casa Cypress",
  neighborhood: "Vila Cypress",
  number: "42",
  postalCode: "04118-010",
  state: "SP",
  street: "Rua do Teste",
};

const catalog = [
  {
    id: 1,
    code: "DEMO-CAMISA-M",
    slug: "demo-camisa",
    name: "Camisa de demonstração",
    brand: "coHida",
    description: "Produto usado pelos testes de clientes.",
    minimumStock: 1,
    active: true,
    categories: ["Demo"],
    variants: [
      {
        id: 1,
        sku: "DEMO-CAMISA-M",
        label: "Padrão",
        color: "Azul",
        size: "M",
        priceCents: 12990,
        stockQuantity: 20,
      },
    ],
    createdAt: "2026-10-03T12:00:00",
  },
];

const emptyCart = {
  id: 1,
  items: [],
  couponCode: null,
  subtotalCents: 0,
  discountCents: 0,
  shippingCents: 0,
  totalCents: 0,
};

function stubCustomerCommerceData() {
  cy.intercept("GET", "**/api/customers/me/cart", emptyCart);
  cy.intercept("GET", "**/api/customers/me/cards", []);
  cy.intercept("GET", "**/api/customers/me/orders", []);
  cy.intercept("GET", "**/api/customers/me/orders/returns", []);
  cy.intercept("GET", "**/api/customers/me/coupons", []);
}

function customerResponse(id: number) {
  return {
    ...customer,
    active: true,
    addresses: [
      { ...deliveryAddress, id: id * 10, label: "Cobrança", type: "BILLING" },
      { ...deliveryAddress, id: id * 10 + 1, type: "DELIVERY" },
    ],
    code: `CLI-${id}`,
    id,
  };
}

function fillCustomerForm() {
  cy.get('input[name="name"]').type(customer.name);
  cy.get('input[name="cpf"]').type(customer.cpf);
  cy.get('input[name="birthDate"]').type(customer.birthDate);
  cy.get('input[name="phone"]').type(customer.phone);
  cy.get('input[name="email"]').type(customer.email);
  cy.get('input[name="password"]').type("Cypress@123");
  cy.get('input[name="passwordConfirmation"]').type("Cypress@123");
  cy.contains("button", "Continuar").click();

  cy.get('input[name="deliveryLabel"]').clear().type(deliveryAddress.label);
  cy.get('input[name="deliveryPostalCode"]').type("04118010");
  cy.get('input[name="deliveryStreet"]').clear().type(deliveryAddress.street);
  cy.get('input[name="deliveryNumber"]').type(deliveryAddress.number);
  cy.get('input[name="deliveryNeighborhood"]')
    .clear()
    .type(deliveryAddress.neighborhood);
  cy.get('input[name="deliveryCity"]').clear().type(deliveryAddress.city);
  cy.get('input[name="deliveryState"]').clear().type(deliveryAddress.state);
  cy.get('input[name="deliveryCountry"]').clear().type(deliveryAddress.country);
}

function expectCreateRequest(alias: `@${string}`) {
  cy.wait(alias)
    .its("request.body")
    .should((body) => {
      expect(body).to.include({
        ...customer,
        cpf: "123.456.789-09",
        phone: "(11) 99999-1234",
      });
      expect(body).to.include({
        password: "Cypress@123",
        passwordConfirmation: "Cypress@123",
      });
      expect(body.deliveryAddress).to.deep.equal(deliveryAddress);
      expect(body.billingAddress).to.deep.equal({
        ...deliveryAddress,
        label: "Cobrança",
      });
    });
}

function loginAsAdmin(customers = [customerResponse(2)]) {
  cy.intercept("POST", "**/api/auth/login", {
    accessToken: adminToken,
    role: "ADMIN",
  }).as("adminLogin");
  cy.intercept(
    { method: "GET", pathname: "/api/customers" },
    { content: customers, totalElements: customers.length },
  ).as("customerList");

  cy.visit("/entrar");
  cy.get('input[name="email"]').type("hmhida@icloud.com");
  cy.get('input[name="password"]').type("H18122005l!");
  cy.contains('button[type="submit"]', "Entrar").click();
  cy.wait("@adminLogin");
  cy.wait("@customerList");
}

describe("criação de clientes", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.viewport(1440, 900);
    cy.intercept("GET", "**/api/products*", catalog).as("catalog");
    cy.intercept("GET", "**/api/admin/demo/seed", { populated: false });
    cy.intercept("GET", "https://viacep.com.br/ws/*/json/", {
      bairro: deliveryAddress.neighborhood,
      localidade: deliveryAddress.city,
      logradouro: deliveryAddress.street,
      uf: deliveryAddress.state,
    });
  });

  it("cria uma conta pelo cadastro público", () => {
    stubCustomerCommerceData();
    cy.intercept("POST", "**/api/auth/register", {
      accessToken: "customer-token",
      role: "CUSTOMER",
    }).as("publicCreate");
    cy.intercept("GET", "**/api/customers/me", customerResponse(1)).as(
      "customerProfile",
    );

    cy.visit("/entrar");
    cy.contains("button", "Criar conta").click();
    fillCustomerForm();
    cy.contains('form button[type="submit"]', "Criar conta").click();

    expectCreateRequest("@publicCreate");
    cy.wait("@customerProfile");
    cy.contains("h1", "Olá, Cliente").should("be.visible");
  });

  it("mostra o erro de e-mail no próprio campo", () => {
    cy.intercept("POST", "**/api/auth/register", {
      statusCode: 409,
      body: { message: "E-mail já cadastrado." },
    }).as("duplicateEmail");

    cy.visit("/entrar");
    cy.contains("button", "Criar conta").click();
    fillCustomerForm();
    cy.contains('form button[type="submit"]', "Criar conta").click();

    cy.wait("@duplicateEmail");
    cy.get('input[name="email"]').should("have.attr", "aria-invalid", "true");
    cy.get('input[name="email"]')
      .parent()
      .contains("E-mail já cadastrado.")
      .should("be.visible");
  });

  it("cria um cliente pelo painel administrativo", () => {
    cy.intercept(
      { method: "GET", pathname: "/api/customers" },
      { content: [], totalElements: 0 },
    ).as("customerList");
    cy.intercept("POST", "**/api/auth/login", {
      accessToken: adminToken,
      role: "ADMIN",
    }).as("adminLogin");
    cy.intercept("POST", "**/api/customers", customerResponse(2)).as(
      "adminCreate",
    );

    cy.visit("/entrar");
    cy.get('input[name="email"]').type("hmhida@icloud.com");
    cy.get('input[name="password"]').type("H18122005l!");
    cy.contains('button[type="submit"]', "Entrar").click();
    cy.wait("@adminLogin");
    cy.wait("@customerList");
    cy.contains("a", "Novo cliente").click();
    fillCustomerForm();
    cy.contains('form button[type="submit"]', "Salvar cliente").click();

    expectCreateRequest("@adminCreate");
  });

  it("mantém o acesso ao painel ao navegar para a loja", () => {
    loginAsAdmin();
    cy.visit("/");

    cy.get('[aria-label="Menu da administradora"]').click();
    cy.contains("Administradora").should("be.visible");
    cy.get('a[href="/admin"]').contains("Ir para admin").should("be.visible");
  });

  it("impede que uma sessão de cliente abra o painel administrativo", () => {
    cy.visit("/admin/clientes", {
      onBeforeLoad(window) {
        window.localStorage.setItem("cohida-access-token", customerToken);
        window.localStorage.setItem("cohida-admin-name", "Administradora");
      },
    });

    cy.location("pathname").should("eq", "/entrar");
    cy.get('[aria-label="Menu da administradora"]').should("not.exist");
  });

  it("lista os produtos retornados pela API no painel", () => {
    cy.intercept("GET", "**/api/admin/products", catalog).as("adminProducts");
    loginAsAdmin();
    cy.visit("/admin/produtos");

    cy.wait("@adminProducts");
    cy.contains("td", "Camisa de demonstração").should("be.visible");
  });

  it("edita sem enviar CPF ou senha", () => {
    loginAsAdmin();
    cy.intercept("GET", "**/api/customers/2", customerResponse(2)).as(
      "customerDetail",
    );
    cy.intercept("PUT", "**/api/customers/2", customerResponse(2)).as(
      "customerUpdate",
    );

    cy.get('[aria-label="Ações do Cliente Cypress"]').click();
    cy.get('[role="menuitem"]').contains("Editar").click();
    cy.wait("@customerDetail");
    cy.get('input[name="name"]').clear().type("Cliente Editado");
    cy.contains("button", "Continuar").click();
    cy.contains('form button[type="submit"]', "Salvar alterações").click();

    cy.wait("@customerUpdate")
      .its("request.body")
      .should((body) => {
        expect(body).to.include({ name: "Cliente Editado" });
        expect(body).not.to.have.any.keys(
          "cpf",
          "password",
          "passwordConfirmation",
        );
      });
    cy.contains("Alterações salvas com sucesso.").should("be.visible");
  });

  it("edita os endereços do cliente", () => {
    loginAsAdmin();
    cy.intercept("GET", "**/api/customers/2", customerResponse(2)).as(
      "customerDetail",
    );
    cy.intercept("PUT", "**/api/customers/2", customerResponse(2)).as(
      "customerUpdate",
    );

    cy.get('[aria-label="Ações do Cliente Cypress"]').click();
    cy.get('[role="menuitem"]').contains("Editar").click();
    cy.wait("@customerDetail");
    cy.contains("button", "Continuar").click();
    cy.get('input[name="billingStreet"]').should("not.exist");
    cy.contains("Usar o endereço de entrega também para cobrança")
      .find('input[type="checkbox"]')
      .uncheck();
    cy.get('input[name="deliveryStreet"]').clear().type("Avenida de Entrega");
    cy.get('input[name="billingStreet"]').clear().type("Rua de Cobrança");
    cy.contains('form button[type="submit"]', "Salvar alterações").click();

    cy.wait("@customerUpdate")
      .its("request.body")
      .should((body) => {
        expect(body.deliveryAddress.street).to.equal("Avenida de Entrega");
        expect(body.billingAddress.street).to.equal("Rua de Cobrança");
      });
  });

  it("mostra erro ao carregar cliente", () => {
    loginAsAdmin();
    cy.intercept("GET", "**/api/customers/2", {
      statusCode: 404,
      body: { message: "Cliente não encontrado." },
    }).as("missingCustomer");

    cy.get('[aria-label="Abrir Cliente Cypress"]').click();
    cy.wait("@missingCustomer");
    cy.contains("Cliente não encontrado.").should("be.visible");
    cy.contains("a", "Voltar para clientes").should("be.visible");
  });

  it("inativa o cliente pela lista", () => {
    loginAsAdmin();
    cy.intercept("PATCH", "**/api/customers/2/deactivate", {
      statusCode: 204,
    }).as("customerDeactivation");

    cy.get('[aria-label="Ações do Cliente Cypress"]').click();
    cy.get('[role="menuitem"]').contains("Excluir").click();
    cy.get('[role="dialog"] button').contains("Excluir").click();
    cy.wait("@customerDeactivation");
  });
});
