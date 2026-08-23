import type { CartItem, Order } from "@/types";

export interface CheckoutAddress {
  id: string;
  city: string;
  complement?: string;
  label: string;
  neighborhood: string;
  number: string;
  state: string;
  street: string;
}

export interface CheckoutPaymentMethod {
  id: string;
  description: string;
  label: string;
}

export interface CustomerCard {
  brand: string;
  id: string;
  isPreferred: boolean;
  label: string;
  lastDigits: string;
}

export interface ExchangeRequest {
  id: string;
  orderId: string;
  productId: string;
  reason: string;
  requestedAt: string;
  status: "requested" | "authorized" | "received" | "completed";
}

export interface Recommendation {
  description: string;
  productId: string;
  reason: string;
}

export const cartDemoItems: CartItem[] = [
  {
    id: "cart-ball-strike-pro",
    productId: "ball-strike-pro",
    quantity: 1,
    unitPriceCents: 14990,
    variantId: "ball-strike-pro-standard",
  },
  {
    id: "cart-velocity-runner",
    productId: "velocity-runner",
    quantity: 1,
    unitPriceCents: 39990,
    variantId: "velocity-runner-40",
  },
  {
    id: "cart-thermal-bottle",
    productId: "thermal-bottle-700",
    quantity: 2,
    unitPriceCents: 7990,
    variantId: "thermal-bottle-green",
  },
];

export const cartShippingCents = 1990;

export const cartReservationNotice = {
  remainingTime: "13:40",
  text: "Seus itens ficam reservados por mais",
};

export const checkoutCoupon = {
  code: "COHIDA15",
  discountCents: 1500,
};

export const checkoutAddresses: CheckoutAddress[] = [
  {
    id: "home",
    city: "São Paulo",
    complement: "Apto. 84",
    label: "Casa",
    neighborhood: "Vila Mariana",
    number: "248",
    state: "SP",
    street: "Rua das Acácias",
  },
  {
    id: "work",
    city: "São Paulo",
    label: "Trabalho",
    neighborhood: "Pinheiros",
    number: "1020",
    state: "SP",
    street: "Avenida Faria Lima",
  },
  {
    id: "gym",
    city: "São Paulo",
    complement: "Recepção",
    label: "Academia",
    neighborhood: "Moema",
    number: "620",
    state: "SP",
    street: "Alameda dos Arapanés",
  },
];

export const checkoutPaymentMethods: CheckoutPaymentMethod[] = [
  {
    id: "card-visa",
    description: "Final 4242 · vence em 08/29",
    label: "Visa",
  },
  {
    id: "pix",
    description: "Aprovação imediata após o pagamento",
    label: "Pix",
  },
  {
    id: "card-mastercard",
    description: "Final 8810 · vence em 03/30",
    label: "Mastercard",
  },
];

export const customerProfile = {
  birthDate: "1999-05-18",
  email: "henrique@cohida.com",
  name: "Henrique Hida",
  phone: "(11) 99999-1234",
};

export const customerCards: CustomerCard[] = [
  {
    brand: "Visa",
    id: "card-visa",
    isPreferred: true,
    label: "Cartão pessoal",
    lastDigits: "4242",
  },
  {
    brand: "Mastercard",
    id: "card-mastercard",
    isPreferred: false,
    label: "Cartão de treino",
    lastDigits: "8810",
  },
  {
    brand: "Elo",
    id: "card-elo",
    isPreferred: false,
    label: "Cartão reserva",
    lastDigits: "1905",
  },
];

export const customerOrders: Order[] = [
  {
    createdAt: "2026-08-12T14:30:00.000Z",
    customerId: "customer-henrique",
    discountCents: 0,
    id: "CH-2026-0802",
    items: [
      {
        id: "order-0802-ball",
        productId: "ball-strike-pro",
        quantity: 1,
        unitPriceCents: 14990,
        variantId: "ball-strike-pro-standard",
      },
    ],
    shippingCents: 1990,
    status: "delivered",
    subtotalCents: 14990,
    totalCents: 16980,
  },
  {
    createdAt: "2026-08-20T10:15:00.000Z",
    customerId: "customer-henrique",
    discountCents: 1500,
    id: "CH-2026-0837",
    items: [
      {
        id: "order-0837-band",
        productId: "powerband-set",
        quantity: 1,
        unitPriceCents: 8990,
        variantId: "powerband-set-standard",
      },
      {
        id: "order-0837-pack",
        productId: "trail-pack-18l",
        quantity: 1,
        unitPriceCents: 22990,
        variantId: "trail-pack-18l-green",
      },
    ],
    shippingCents: 0,
    status: "in_transit",
    subtotalCents: 31980,
    totalCents: 30480,
  },
  {
    createdAt: "2026-08-21T18:40:00.000Z",
    customerId: "customer-henrique",
    discountCents: 0,
    id: "CH-2026-0839",
    items: [
      {
        id: "order-0839-runner",
        productId: "velocity-runner",
        quantity: 1,
        unitPriceCents: 39990,
        variantId: "velocity-runner-41",
      },
    ],
    shippingCents: 0,
    status: "approved",
    subtotalCents: 39990,
    totalCents: 39990,
  },
  {
    createdAt: "2026-08-22T09:10:00.000Z",
    customerId: "customer-henrique",
    discountCents: 0,
    id: "CH-2026-0840",
    items: [
      {
        id: "order-0840-boot",
        productId: "apex-field-boot",
        quantity: 1,
        unitPriceCents: 25990,
        variantId: "apex-field-40",
      },
      {
        id: "order-0840-bottle",
        productId: "thermal-bottle-700",
        quantity: 1,
        unitPriceCents: 7990,
        variantId: "thermal-bottle-green",
      },
    ],
    shippingCents: 1990,
    status: "processing",
    subtotalCents: 33980,
    totalCents: 35970,
  },
  {
    createdAt: "2026-08-05T11:30:00.000Z",
    customerId: "customer-henrique",
    discountCents: 0,
    id: "CH-2026-0775",
    items: [
      {
        id: "order-0775-headlamp",
        productId: "trail-headlamp",
        quantity: 1,
        unitPriceCents: 15990,
        variantId: "trail-headlamp-standard",
      },
    ],
    shippingCents: 1990,
    status: "rejected",
    subtotalCents: 15990,
    totalCents: 17980,
  },
];

export const exchangeRequests: ExchangeRequest[] = [
  {
    id: "EX-2026-014",
    orderId: "CH-2026-0802",
    productId: "ball-strike-pro",
    reason: "Produto diferente do esperado",
    requestedAt: "2026-08-16T09:20:00.000Z",
    status: "authorized",
  },
  {
    id: "EX-2026-015",
    orderId: "CH-2026-0802",
    productId: "ball-strike-pro",
    reason: "Produto com defeito",
    requestedAt: "2026-08-17T15:10:00.000Z",
    status: "received",
  },
  {
    id: "EX-2026-016",
    orderId: "CH-2026-0839",
    productId: "velocity-runner",
    reason: "Tamanho ou variação incorreta",
    requestedAt: "2026-08-22T18:00:00.000Z",
    status: "requested",
  },
  {
    id: "EX-2026-009",
    orderId: "CH-2026-0784",
    productId: "trail-pack-18l",
    reason: "Produto diferente do esperado",
    requestedAt: "2026-08-09T10:30:00.000Z",
    status: "completed",
  },
];

export const recommendations: Recommendation[] = [
  {
    description: "Leve, respirável e pronto para os seus treinos de corrida.",
    productId: "velocity-runner",
    reason: "Combina com seus interesses em corrida",
  },
  {
    description: "Uma opção versátil para completar seu treino funcional.",
    productId: "powerband-set",
    reason: "Baseado nos seus últimos pedidos",
  },
  {
    description: "Mantenha a hidratação sempre à mão em treinos e trilhas.",
    productId: "thermal-bottle-700",
    reason: "Muito escolhido por quem treina ao ar livre",
  },
  {
    description: "Uma camada leve para os dias de vento na corrida.",
    productId: "wind-shell-jacket",
    reason: "Combina com seus treinos ao ar livre",
  },
];

export const chatbotSuggestions = [
  "Quero começar a correr",
  "Qual equipamento para treino funcional?",
  "Me mostre produtos para futebol",
  "Preciso de itens para uma trilha",
  "Qual presente serve para quem treina?",
];

export const chatbotResponses = {
  default:
    "Posso te ajudar a encontrar o equipamento ideal. Conte qual esporte você pratica e seu objetivo.",
  football:
    "Para futebol, a Bola Strike Pro é uma ótima escolha para jogos e treinos frequentes. Quer ver mais detalhes?",
  running:
    "Para começar a correr, priorize um tênis com amortecimento e um ajuste confortável. O Velocity Runner foi selecionado para treinos diários.",
  training:
    "Para treino funcional, as faixas PowerBand ajudam em mobilidade, ativação e fortalecimento progressivo.",
  outdoor:
    "Para trilhas, comece por hidratação, iluminação e uma mochila leve. Posso sugerir um kit para o seu percurso.",
  gift: "Para presentear, uma garrafa térmica ou um kit de treino são escolhas versáteis. Quer ver as opções mais populares?",
};
