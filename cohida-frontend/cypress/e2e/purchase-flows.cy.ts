/// <reference types="cypress" />

export {};

type Address = {
  id: number;
  label: string;
  street: string;
  number: string;
  neighborhood: string;
  zipCode: string;
  city: string;
  state: string;
  country: string;
  type: "DELIVERY" | "BILLING";
};

type ApiCart = {
  id: number;
  items: Array<{
    id: number;
    variantId: number;
    productId: number;
    productName: string;
    sku: string;
    label: string;
    unitPriceCents: number;
    quantity: number;
    lineTotalCents: number;
    availableStock: number;
  }>;
  couponCode: string | null;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
};

const address: Address = {
  id: 11,
  label: "Casa",
  street: "Rua das Flores",
  number: "42",
  neighborhood: "Centro",
  zipCode: "01001000",
  city: "São Paulo",
  state: "SP",
  country: "Brasil",
  type: "DELIVERY",
};

const secondAddress: Address = {
  ...address,
  id: 12,
  label: "Trabalho",
  street: "Avenida Paulista",
  number: "1000",
};

const cards = [
  {
    id: 21,
    brand: "Visa",
    lastDigits: "4242",
    label: "Cartão pessoal",
    expiryMonth: 12,
    expiryYear: 2030,
    preferred: true,
  },
  {
    id: 22,
    brand: "Mastercard",
    lastDigits: "4444",
    label: "Cartão secundário",
    expiryMonth: 10,
    expiryYear: 2031,
    preferred: false,
  },
];

const books = [
  {
    id: 31,
    code: "LIVRO-001",
    slug: "livro-a",
    name: "Livro de Cypress",
    brand: "coHida",
    description: "Livro de teste do fluxo de compra.",
    minimumStock: 1,
    active: true,
    categories: ["livros"],
    variants: [
      {
        id: 311,
        sku: "LIVRO-001-UN",
        label: "Único",
        color: null,
        size: null,
        priceCents: 6000,
        stockQuantity: 20,
      },
    ],
    createdAt: "2026-01-01T10:00:00",
  },
  {
    id: 32,
    code: "LIVRO-002",
    slug: "livro-b",
    name: "Livro de testes de software",
    brand: "coHida",
    description: "Outro livro de teste do fluxo de compra.",
    minimumStock: 1,
    active: true,
    categories: ["livros"],
    variants: [
      {
        id: 321,
        sku: "LIVRO-002-UN",
        label: "Único",
        color: null,
        size: null,
        priceCents: 14000,
        stockQuantity: 20,
      },
    ],
    createdAt: "2026-01-02T10:00:00",
  },
];

const customer = {
  id: 7,
  code: "CLI-7",
  name: "Cliente Cypress",
  birthDate: "1995-05-15",
  cpf: "123.456.789-09",
  phone: "(11) 99999-1234",
  email: "cliente.cypress@cohida.test",
  active: true,
  addresses: [
    { ...address, postalCode: address.zipCode },
    { ...secondAddress, postalCode: secondAddress.zipCode },
  ],
};

function cart(
  items: Array<{ productIndex: number; quantity: number }>,
  options: { couponCode?: string | null; discountCents?: number } = {},
): ApiCart {
  const mappedItems = items.map(({ productIndex, quantity }, index) => {
    const product = books[productIndex];
    const variant = product.variants[0];
    return {
      id: 101 + index,
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      sku: variant.sku,
      label: variant.label,
      unitPriceCents: variant.priceCents,
      quantity,
      lineTotalCents: variant.priceCents * quantity,
      availableStock: variant.stockQuantity,
    };
  });
  const subtotalCents = mappedItems.reduce(
    (sum, item) => sum + item.lineTotalCents,
    0,
  );
  const discountCents = options.discountCents ?? 0;
  const shippingCents = 0;
  return {
    id: 1,
    items: mappedItems,
    couponCode: options.couponCode ?? null,
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: Math.max(0, subtotalCents - discountCents + shippingCents),
  };
}

function apiOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 9001,
    customerId: customer.id,
    customerName: customer.name,
    status: "EM_PROCESSAMENTO",
    items: [
      {
        variantId: books[0].variants[0].id,
        productName: books[0].name,
        sku: books[0].variants[0].sku,
        variantLabel: "Único",
        unitPriceCents: 6000,
        quantity: 1,
      },
    ],
    subtotalCents: 6000,
    discountCents: 0,
    shippingCents: 0,
    totalCents: 6000,
    couponCode: null,
    cardBrand: "Visa",
    cardLastDigits: "4242",
    payments: [
      {
        paymentCardId: cards[0].id,
        brand: "Visa",
        lastDigits: "4242",
        amountCents: 6000,
      },
    ],
    issuedCouponCode: null,
    issuedCouponValueCents: null,
    deliveryLabel: address.label,
    deliveryStreet: address.street,
    deliveryNumber: address.number,
    deliveryNeighborhood: address.neighborhood,
    deliveryZipCode: address.zipCode,
    deliveryCity: address.city,
    deliveryState: address.state,
    deliveryCountry: address.country,
    createdAt: "2026-10-03T12:00:00",
    ...overrides,
  };
}

function bootStore(initialCart = cart([]), availableCards = cards) {
  let currentCart = initialCart;
  let currentCards = availableCards;
  let nextItemId = 200;
  let nextAddressId = 30;
  let nextCardId = 40;

  cy.intercept("GET", "**/api/products*", books).as("catalog");
  cy.intercept("GET", "**/api/customers/me", customer).as("profile");
  cy.intercept("GET", "**/api/customers/me/cart", (request) =>
    request.reply(currentCart),
  ).as("getCart");
  cy.intercept("GET", "**/api/customers/me/cards", (request) =>
    request.reply(currentCards),
  ).as("getCards");
  cy.intercept("GET", "**/api/customers/me/orders", []).as("getOrders");
  cy.intercept("GET", "**/api/customers/me/orders/returns", []).as(
    "getReturns",
  );
  cy.intercept("GET", "**/api/customers/me/coupons", []).as("getCoupons");
  cy.intercept("POST", "**/api/customers/me/cart/items", (request) => {
    const { variantId, quantity } = request.body as {
      variantId: number;
      quantity: number;
    };
    const productIndex = books.findIndex((item) =>
      item.variants.some((variant) => variant.id === variantId),
    );
    const existing = currentCart.items.find(
      (item) => item.variantId === variantId,
    );
    if (existing) {
      existing.quantity += quantity;
      existing.lineTotalCents = existing.unitPriceCents * existing.quantity;
    } else {
      const product = books[productIndex];
      const variant = product.variants[0];
      currentCart.items.push({
        id: nextItemId++,
        variantId,
        productId: product.id,
        productName: product.name,
        sku: variant.sku,
        label: variant.label,
        unitPriceCents: variant.priceCents,
        quantity,
        lineTotalCents: variant.priceCents * quantity,
        availableStock: variant.stockQuantity,
      });
    }
    currentCart = cart(
      currentCart.items.map((item) => ({
        productIndex: books.findIndex(
          (product) => product.id === item.productId,
        ),
        quantity: item.quantity,
      })),
      {
        couponCode: currentCart.couponCode,
        discountCents: currentCart.discountCents,
      },
    );
    request.reply(currentCart);
  }).as("addCartItem");
  cy.intercept("PATCH", "**/api/customers/me/cart/items/*", (request) => {
    const id = Number(request.url.split("/").at(-1));
    const item = currentCart.items.find((entry) => entry.id === id);
    if (item) item.quantity = request.body.quantity;
    currentCart = cart(
      currentCart.items.map((entry) => ({
        productIndex: books.findIndex(
          (product) => product.id === entry.productId,
        ),
        quantity: entry.quantity,
      })),
      {
        couponCode: currentCart.couponCode,
        discountCents: currentCart.discountCents,
      },
    );
    request.reply(currentCart);
  }).as("updateCartItem");
  cy.intercept("POST", "**/api/customers/me/cart/coupon", (request) => {
    const code = String(request.body.code);
    const discounts: Record<string, number> = {
      "DESCONTO-20": 2000,
      "QUASE-TUDO": Math.max(0, currentCart.subtotalCents - 500),
      "CREDITO-ACIMA": currentCart.subtotalCents + 7000,
    };
    const discountCents = discounts[code] ?? 0;
    currentCart = cart(
      currentCart.items.map((item) => ({
        productIndex: books.findIndex(
          (product) => product.id === item.productId,
        ),
        quantity: item.quantity,
      })),
      { couponCode: code, discountCents },
    );
    request.reply(currentCart);
  }).as("applyCoupon");
  cy.intercept("POST", "**/api/customers/me/addresses", (request) => {
    const created = { ...request.body, id: nextAddressId++, type: "DELIVERY" };
    request.reply(created);
  }).as("createAddress");
  cy.intercept("POST", "**/api/customers/me/cards", (request) => {
    const created = {
      id: nextCardId++,
      brand: "Mastercard",
      lastDigits: String(request.body.cardNumber).replaceAll(" ", "").slice(-4),
      label: request.body.label,
      expiryMonth: request.body.expiryMonth,
      expiryYear: request.body.expiryYear,
      preferred: currentCards.length === 0,
    };
    currentCards = [...currentCards, created];
    request.reply(created);
  }).as("createCard");
  cy.intercept("POST", "**/api/customers/me/checkout", (request) => {
    const issued = currentCart.couponCode === "CREDITO-ACIMA";
    request.reply(
      apiOrder({
        totalCents: currentCart.totalCents,
        issuedCouponCode: issued ? "TROCA-CYPRESS" : null,
        issuedCouponValueCents: issued ? 7000 : null,
      }),
    );
  }).as("checkout");

  cy.visit("/", {
    onBeforeLoad(window) {
      window.localStorage.setItem(
        "cohida-access-token",
        "eyJhbGciOiJub25lIn0.eyJyb2xlIjoiQ1VTVE9NRVIiLCJleHAiOjQxMDI0NDQ4MDB9.signature",
      );
    },
  });
  cy.wait(["@catalog", "@profile"]);
  cy.wait([
    "@getCart",
    "@getCards",
    "@getOrders",
    "@getReturns",
    "@getCoupons",
  ]);
}

function openCheckout() {
  cy.get('a[href="/carrinho"]').first().click();
  cy.get('a[href="/checkout"]').click();
}

function finishOrder() {
  cy.contains("button", "Confirmar pedido").click();
  cy.wait("@checkout");
  cy.contains("h1", "Pedido em processamento").should("be.visible");
  cy.contains("Número do pedido").parent().should("contain", "9001");
}

describe("fluxos de compra", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.viewport(1440, 1000);
  });

  it("adiciona mais de um produto ao carrinho e altera a quantidade", () => {
    bootStore();

    cy.get('a[href="/produtos"]').first().click();
    cy.get('a[aria-label="Ver Livro de Cypress"]').click();
    cy.contains("button", "Adicionar ao carrinho").click();
    cy.wait("@addCartItem").its("request.body").should("deep.equal", {
      variantId: books[0].variants[0].id,
      quantity: 1,
    });
    cy.get('a[href="/produtos"]').first().click();
    cy.get('a[aria-label="Ver Livro de testes de software"]').click();
    cy.contains("button", "Adicionar ao carrinho").click();
    cy.wait("@addCartItem").its("request.body").should("deep.equal", {
      variantId: books[1].variants[0].id,
      quantity: 1,
    });

    cy.visit("/carrinho");
    cy.contains("Livro de Cypress").should("be.visible");
    cy.contains("Livro de testes de software").should("be.visible");
    cy.get(
      'button[aria-label="Aumentar quantidade de Livro de Cypress"]',
    ).click();
    cy.wait("@updateCartItem")
      .its("request.body")
      .should("deep.equal", { quantity: 2 });
    cy.contains("Livro de Cypress")
      .closest("article")
      .find("span.w-8")
      .should("have.text", "2");
  });

  it("finaliza a compra usando endereço e cartão já cadastrados", () => {
    bootStore(cart([{ productIndex: 0, quantity: 1 }]));
    openCheckout();

    cy.get('input[name="delivery-address"]').first().should("be.checked");
    cy.contains("Cartão pessoal").should("be.visible");
    finishOrder();

    cy.get("@checkout")
      .its("request.body")
      .should("deep.equal", {
        deliveryAddressId: address.id,
        payments: [{ paymentCardId: cards[0].id, amountCents: 6000 }],
      });
  });

  it("salva novo endereço e novo cartão do checkout no perfil do cliente", () => {
    bootStore(cart([{ productIndex: 1, quantity: 1 }]), []);
    openCheckout();

    cy.contains("button", "Adicionar endereço").click();
    cy.get('input[name="label"]').type("Casa nova");
    cy.get('input[name="postalCode"]').type("01310100");
    cy.get('input[name="number"]').type("55");
    cy.get('input[name="street"]').type("Alameda Cypress");
    cy.get('input[name="neighborhood"]').type("Bela Vista");
    cy.get('input[name="city"]').type("São Paulo");
    cy.get('input[name="state"]').type("SP");
    cy.contains("button", "Usar este endereço").click();
    cy.wait("@createAddress").its("request.body").should("include", {
      label: "Casa nova",
      street: "Alameda Cypress",
      number: "55",
      type: "DELIVERY",
    });
    cy.contains("Casa nova").should("be.visible");

    cy.contains("button", "Usar outro cartão").click();
    cy.get('input[name="cardNumber"]').type("5555 5555 5555 4444");
    cy.get('input[name="label"]').last().type("Cartão novo");
    cy.get('input[name="expiry"]').type("12/30");
    cy.get('input[maxlength="4"]').type("123");
    cy.contains("button", "Usar este cartão").click();
    cy.wait("@createCard").its("request.body").should("include", {
      label: "Cartão novo",
      cardNumber: "5555 5555 5555 4444",
    });
    cy.contains("Cartão novo").should("be.visible");
    cy.contains("Cartão novo").click();
    finishOrder();

    cy.get('button[aria-label="Menu da conta"]').click();
    cy.contains("a", "Minha conta").click();
    cy.contains("button", "Endereços").click();
    cy.contains("Casa nova").should("be.visible");
    cy.contains("button", "Cartões").click();
    cy.contains("Cartão novo").should("be.visible");
  });

  it("permite dividir o pagamento entre cartões quando cada parcela atinge R$ 10,00", () => {
    bootStore(cart([{ productIndex: 1, quantity: 2 }]));
    openCheckout();

    cy.contains("Cartão secundário").click();
    cy.get('input[type="number"]').eq(0).type("20.00");
    cy.get('input[type="number"]').eq(1).type("8.00");
    cy.contains("button", "Confirmar pedido").click();
    cy.contains("Em pagamentos combinados").should("be.visible");
    cy.get("@checkout.all").should("have.length", 0);

    cy.get('input[type="number"]').eq(1).clear().type("260.00");
    cy.contains("button", "Confirmar pedido").click();
    cy.get("@checkout")
      .its("request.body")
      .should((body) => {
        expect(body).to.have.property("payments");
        expect(body.payments).to.deep.equal([
          { paymentCardId: cards[0].id, amountCents: 2000 },
          { paymentCardId: cards[1].id, amountCents: 26000 },
        ]);
      });
  });

  it("combina cupom e cartão e impede cobrança inferior a R$ 10,00 no cartão", () => {
    bootStore(cart([{ productIndex: 0, quantity: 2 }]));
    openCheckout();

    cy.get("#coupon").type("QUASE-TUDO");
    cy.contains("button", "Aplicar").click();
    cy.wait("@applyCoupon");
    cy.contains("QUASE-TUDO").should("be.visible");
    cy.contains("button", "Confirmar pedido").click();
    cy.get("@checkout.all").should("have.length", 0);
  });

  it("aplica cupom promocional ao pedido pago com cartão", () => {
    bootStore(cart([{ productIndex: 1, quantity: 1 }]));
    openCheckout();

    cy.get("#coupon").type("DESCONTO-20");
    cy.contains("button", "Aplicar").click();
    cy.wait("@applyCoupon");
    cy.contains("DESCONTO-20").should("be.visible");
    finishOrder();
    cy.get("@checkout")
      .its("request.body")
      .should("deep.equal", {
        deliveryAddressId: address.id,
        payments: [{ paymentCardId: cards[0].id, amountCents: 12000 }],
      });
  });

  it("emite crédito de troca pela diferença quando o cupom supera a compra", () => {
    bootStore(cart([{ productIndex: 0, quantity: 1 }]));
    openCheckout();

    cy.get("#coupon").type("CREDITO-ACIMA");
    cy.contains("button", "Aplicar").click();
    cy.wait("@applyCoupon");
    cy.contains("button", "Confirmar pedido").click();
    cy.get("@checkout")
      .its("request.body")
      .its("deliveryAddressId")
      .should("eq", address.id);
    cy.get("@checkout")
      .its("request.body.payments")
      .should("have.length", 1)
      .its("0.amountCents")
      .should("eq", 0);
    cy.contains("Cupom de troca").should("be.visible");
    cy.contains("R$ 70,00").should("be.visible");
  });

  it("registra o pedido finalizado com status EM_PROCESSAMENTO", () => {
    bootStore(cart([{ productIndex: 1, quantity: 1 }]));
    openCheckout();
    finishOrder();

    cy.get("@checkout").then(({ response }) => {
      expect(response?.body.status).to.equal("EM_PROCESSAMENTO");
    });
  });
});
