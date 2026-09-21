import { Boxes, CircleAlert, ClipboardCheck, TrendingUp } from "lucide-react";

export type AdminResource =
  "clientes" | "estoque" | "pedidos" | "produtos" | "trocas" | "analises";

export const adminDashboardMetrics = [
  {
    detail: "+12,5% vs. mês anterior",
    icon: TrendingUp,
    label: "Vendas aprovadas",
    to: "/admin/analises",
    value: "R$ 48.760,00",
  },
  {
    detail: "6 aguardam aprovação",
    icon: ClipboardCheck,
    label: "Pedidos hoje",
    to: "/admin/pedidos",
    value: "28",
  },
  {
    detail: "3 produtos abaixo do mínimo",
    icon: CircleAlert,
    label: "Alertas de estoque",
    to: "/admin/estoque",
    value: "7",
  },
  {
    detail: "2 aguardam recebimento",
    icon: Boxes,
    label: "Trocas abertas",
    to: "/admin/trocas",
    value: "5",
  },
];

export const adminRecentOrders = [
  {
    customer: "Luana Martins",
    id: "#COH-1048",
    status: "EM PROCESSAMENTO",
    total: "R$ 429,90",
  },
  {
    customer: "Gabriel Souza",
    id: "#COH-1047",
    status: "PAGAMENTO REALIZADO",
    total: "R$ 1.129,00",
  },
  {
    customer: "Camila Rocha",
    id: "#COH-1046",
    status: "EM TRÂNSITO",
    total: "R$ 289,90",
  },
];

export const adminLowStockProducts = [
  { minimum: 5, name: "Bola de Futebol Pro X", quantity: 1 },
  { minimum: 5, name: "Tênis Run Flow", quantity: 4 },
  { minimum: 4, name: "Kit Elástico Resistance", quantity: 1 },
];

export const adminProductFormOptions = {
  brands: ["Nike", "Adidas", "Puma", "Kipsta", "Vollo"],
  categories: [
    "Futebol",
    "Corrida",
    "Treino e academia",
    "Artes marciais",
    "Basquete",
    "Vôlei",
  ],
  pricingGroups: [
    { label: "Performance", margin: "40%" },
    { label: "Essentials", margin: "32%" },
    { label: "Acessórios", margin: "25%" },
  ],
};

export interface AdminProduct {
  barcode: string;
  brand: string;
  categories: string[];
  code: string;
  cost: string;
  description: string;
  dimensions: { depth: string; height: string; weight: string; width: string };
  id: string;
  name: string;
  pricingGroup: string;
  salePrice: string;
  status: "ATIVO" | "INATIVO";
  stock: { available: number; minimum: number; reserved: number };
  attributes: { color: string; material: string; model: string; size: string };
}

export const adminProducts: AdminProduct[] = [
  {
    attributes: {
      color: "Branco e preto",
      material: "PU texturizado",
      model: "Pro X",
      size: "5",
    },
    barcode: "7890000000001",
    brand: "Kipsta",
    categories: ["Futebol"],
    code: "PRD-0001",
    cost: "R$ 142,79",
    description:
      "Bola de futebol para partidas e treinos, com superfície texturizada e alta durabilidade.",
    dimensions: { depth: "22", height: "22", weight: "0,43", width: "22" },
    id: "bola-futebol-pro-x",
    name: "Bola de Futebol Pro X",
    pricingGroup: "Performance",
    salePrice: "R$ 199,90",
    status: "ATIVO",
    stock: { available: 1, minimum: 5, reserved: 2 },
  },
  {
    attributes: {
      color: "Cinza e laranja",
      material: "Mesh respirável",
      model: "Run Flow",
      size: "40",
    },
    barcode: "7890000000002",
    brand: "Nike",
    categories: ["Corrida"],
    code: "PRD-0002",
    cost: "R$ 328,50",
    description:
      "Tênis para corrida diária com amortecimento responsivo e cabedal respirável.",
    dimensions: { depth: "32", height: "14", weight: "0,58", width: "21" },
    id: "tenis-run-flow",
    name: "Tênis Run Flow",
    pricingGroup: "Performance",
    salePrice: "R$ 459,90",
    status: "ATIVO",
    stock: { available: 4, minimum: 5, reserved: 1 },
  },
  {
    attributes: {
      color: "Preto",
      material: "Látex natural",
      model: "Resistance",
      size: "Único",
    },
    barcode: "7890000000003",
    brand: "Vollo",
    categories: ["Treino e academia"],
    code: "PRD-0003",
    cost: "R$ 85,64",
    description:
      "Kit de faixas elásticas com diferentes níveis de resistência para treinos funcionais.",
    dimensions: { depth: "8", height: "24", weight: "0,35", width: "18" },
    id: "kit-elastico-resistance",
    name: "Kit Elástico Resistance",
    pricingGroup: "Acessórios",
    salePrice: "R$ 119,90",
    status: "ATIVO",
    stock: { available: 1, minimum: 4, reserved: 1 },
  },
];

export const adminProductAuditEntries = [
  {
    action: "Produto criado",
    actor: "Marina Costa",
    date: "21 ago. 2026, 14:32",
    detail: "Cadastro inicial do produto.",
  },
  {
    action: "Estoque atualizado",
    actor: "Rafael Nunes",
    date: "22 ago. 2026, 09:18",
    detail: "Entrada de 20 unidades pelo fornecedor Sport Supply.",
  },
  {
    action: "Preço recalculado",
    actor: "Sistema",
    date: "22 ago. 2026, 09:19",
    detail: "Preço de venda recalculado conforme grupo Performance.",
  },
];

export const adminProductDeactivationOptions = [
  "FORA DE MERCADO",
  "BAIXA PERFORMANCE",
  "PROBLEMA DE FORNECIMENTO",
  "OUTRO",
];

export const adminCustomerFormOptions = {
  states: ["SP", "RJ", "MG", "PR", "SC", "RS"],
};

export const adminStockEntryFormOptions = {
  products: adminProducts.map(({ code, id, name }) => ({ code, id, name })),
  suppliers: ["Fit Pro", "Move Brasil", "Sport Supply"],
};

export type AdminOrderStatus =
  | "EM ABERTO"
  | "EM PROCESSAMENTO"
  | "PAGAMENTO REALIZADO"
  | "EM TRÂNSITO"
  | "ENTREGUE";

export interface AdminOrder {
  customer: { email: string; name: string; phone: string };
  deliveryAddress: string;
  id: string;
  items: Array<{
    name: string;
    quantity: number;
    total: string;
    unitPrice: string;
  }>;
  payment: {
    card: string;
    coupon: string | null;
    freight: string;
    subtotal: string;
    total: string;
  };
  placedAt: string;
  status: AdminOrderStatus;
}

export const adminOrderStatusSteps: AdminOrderStatus[] = [
  "EM ABERTO",
  "EM PROCESSAMENTO",
  "PAGAMENTO REALIZADO",
  "EM TRÂNSITO",
  "ENTREGUE",
];

export const adminOrders: AdminOrder[] = [
  {
    customer: {
      email: "mariana.alves@email.com",
      name: "Mariana Alves",
      phone: "(11) 96666-1188",
    },
    deliveryAddress:
      "Rua da Consolação, 905 · Consolação · São Paulo, SP · 01301-000",
    id: "COH-1049",
    items: [
      {
        name: "Garrafa Térmica 700 ml",
        quantity: 1,
        total: "R$ 79,90",
        unitPrice: "R$ 79,90",
      },
    ],
    payment: {
      card: "Elo final 1905",
      coupon: null,
      freight: "R$ 19,90",
      subtotal: "R$ 79,90",
      total: "R$ 99,80",
    },
    placedAt: "23 ago. 2026, 11:05",
    status: "EM ABERTO",
  },
  {
    customer: {
      email: "luana.martins@email.com",
      name: "Luana Martins",
      phone: "(11) 99999-1020",
    },
    deliveryAddress:
      "Rua das Palmeiras, 240 · Vila Oliveira · Mogi das Cruzes, SP · 08780-120",
    id: "COH-1048",
    items: [
      {
        name: "Bola de Futebol Pro X",
        quantity: 2,
        total: "R$ 399,80",
        unitPrice: "R$ 199,90",
      },
    ],
    payment: {
      card: "Visa final 2048",
      coupon: null,
      freight: "R$ 30,10",
      subtotal: "R$ 399,80",
      total: "R$ 429,90",
    },
    placedAt: "23 ago. 2026, 10:32",
    status: "EM PROCESSAMENTO",
  },
  {
    customer: {
      email: "gabriel.souza@email.com",
      name: "Gabriel Souza",
      phone: "(11) 98888-7744",
    },
    deliveryAddress: "Avenida Brasil, 810 · Centro · São Paulo, SP · 01010-100",
    id: "COH-1047",
    items: [
      {
        name: "Tênis Run Flow",
        quantity: 2,
        total: "R$ 919,80",
        unitPrice: "R$ 459,90",
      },
      {
        name: "Kit Elástico Resistance",
        quantity: 1,
        total: "R$ 119,90",
        unitPrice: "R$ 119,90",
      },
    ],
    payment: {
      card: "Mastercard final 4410",
      coupon: null,
      freight: "R$ 89,30",
      subtotal: "R$ 1.039,70",
      total: "R$ 1.129,00",
    },
    placedAt: "23 ago. 2026, 09:18",
    status: "PAGAMENTO REALIZADO",
  },
  {
    customer: {
      email: "camila.rocha@email.com",
      name: "Camila Rocha",
      phone: "(11) 97777-3232",
    },
    deliveryAddress:
      "Alameda dos Esportes, 47 · Moema · São Paulo, SP · 04500-000",
    id: "COH-1046",
    items: [
      {
        name: "Kit Elástico Resistance",
        quantity: 2,
        total: "R$ 239,80",
        unitPrice: "R$ 119,90",
      },
    ],
    payment: {
      card: "Pix",
      coupon: "R$ 0,00",
      freight: "R$ 50,10",
      subtotal: "R$ 239,80",
      total: "R$ 289,90",
    },
    placedAt: "22 ago. 2026, 16:48",
    status: "EM TRÂNSITO",
  },
  {
    customer: {
      email: "pedro.oliveira@email.com",
      name: "Pedro Oliveira",
      phone: "(11) 95555-7777",
    },
    deliveryAddress:
      "Rua das Oliveiras, 61 · Tatuapé · São Paulo, SP · 03308-000",
    id: "COH-1045",
    items: [
      {
        name: "Faixa de Judô Verde",
        quantity: 1,
        total: "R$ 39,90",
        unitPrice: "R$ 39,90",
      },
    ],
    payment: {
      card: "Pix",
      coupon: "TROCA-1000",
      freight: "R$ 0,00",
      subtotal: "R$ 39,90",
      total: "R$ 29,90",
    },
    placedAt: "21 ago. 2026, 14:22",
    status: "ENTREGUE",
  },
];

export type AdminExchangeStatus =
  | "TROCA SOLICITADA"
  | "TROCA ACEITA"
  | "TROCA NEGADA"
  | "ITEM ENVIADO"
  | "ITEM RECEBIDO"
  | "TROCA PROCESSADA";

export const adminExchangeStatusSteps: AdminExchangeStatus[] = [
  "TROCA SOLICITADA",
  "TROCA ACEITA",
  "ITEM ENVIADO",
  "ITEM RECEBIDO",
  "TROCA PROCESSADA",
];
export const adminExchanges = [
  {
    customer: "Renato Lima",
    id: "TRC-024",
    item: "Tênis Run Flow",
    orderId: "COH-1027",
    reason: "Tamanho não serviu",
    status: "TROCA ACEITA" as AdminExchangeStatus,
    value: "R$ 459,90",
  },
  {
    customer: "Aline Castro",
    id: "TRC-023",
    item: "Caneleira Pro",
    orderId: "COH-1018",
    reason: "Produto com defeito",
    status: "TROCA SOLICITADA" as AdminExchangeStatus,
    value: "R$ 89,90",
  },
];

export const adminCustomers = [
  {
    code: "CLI-0184",
    email: "luana.martins@email.com",
    id: "luana-martins",
    name: "Luana Martins",
    orders: 6,
    phone: "(11) 99999-1020",
    profile: "Frequente",
    status: "ATIVO",
  },
  {
    code: "CLI-0183",
    email: "gabriel.souza@email.com",
    id: "gabriel-souza",
    name: "Gabriel Souza",
    orders: 3,
    phone: "(11) 98888-7744",
    profile: "Recorrente",
    status: "ATIVO",
  },
  {
    code: "CLI-0182",
    email: "camila.rocha@email.com",
    id: "camila-rocha",
    name: "Camila Rocha",
    orders: 1,
    phone: "(11) 97777-3232",
    profile: "Novo",
    status: "ATIVO",
  },
];

export const adminStockMovements = [
  {
    actor: "Rafael Nunes",
    date: "23 ago. 2026, 09:18",
    product: "Bola de Futebol Pro X",
    quantity: "+20 un.",
    type: "ENTRADA",
  },
  {
    actor: "Sistema",
    date: "23 ago. 2026, 10:32",
    product: "Bola de Futebol Pro X",
    quantity: "-2 un.",
    type: "VENDA APROVADA",
  },
  {
    actor: "Marina Costa",
    date: "22 ago. 2026, 16:05",
    product: "Kit Elástico Resistance",
    quantity: "+1 un.",
    type: "RETORNO DE TROCA",
  },
];

export const adminAnalyticsData = {
  categories: ["Futebol", "Corrida", "Treino"],
  months: [
    { date: "2026-06-01", label: "Jun." },
    { date: "2026-07-01", label: "Jul." },
    { date: "2026-08-01", label: "Ago." },
  ],
  series: [
    { category: "Futebol", values: [8420, 9310, 11900] },
    { category: "Corrida", values: [7200, 8100, 9870] },
    { category: "Treino", values: [5900, 6420, 7340] },
  ],
  topProducts: [
    {
      name: "Bola Pro X",
      revenue: 9995,
      monthlyUnits: [20, 12, 18],
      units: 50,
    },
    {
      name: "Tênis Run Flow",
      revenue: 9198,
      monthlyUnits: [7, 6, 7],
      units: 20,
    },
    {
      name: "Kit Resistance",
      revenue: 5712,
      monthlyUnits: [15, 16, 17],
      units: 48,
    },
    {
      name: "Caneleira Pro",
      revenue: 3596,
      monthlyUnits: [13, 12, 15],
      units: 40,
    },
    {
      name: "Munhequeira",
      revenue: 1890,
      monthlyUnits: [21, 20, 22],
      units: 63,
    },
  ],
};

export const adminConfigurationSections = [
  {
    id: "precos",
    label: "Grupos de preço",
    description: "Margens e aprovações abaixo da margem.",
  },
  {
    id: "catalogos",
    label: "Cadastros-base",
    description: "Marcas, categorias, fornecedores e bandeiras.",
  },
  {
    id: "auditoria",
    label: "Auditoria",
    description: "Histórico de operações de escrita.",
  },
  {
    id: "parametros",
    label: "Parâmetros",
    description: "Reserva e desativação automática.",
  },
  {
    id: "usuarios",
    label: "Usuários e permissões",
    description: "Acessos administrativos.",
  },
];

export type AdminConfigurationSectionId =
  "precos" | "catalogos" | "auditoria" | "parametros" | "usuarios";

export type AdminConfigurationRecord = {
  details: string;
  id: string;
  title: string;
  values: Record<string, boolean | string>;
};

export const adminConfigurationFormOptions = {
  catalogTypes: ["Marca", "Categoria", "Fornecedor", "Bandeira"],
  parameterUnits: ["minutos", "dias", "percentual", "unidades"],
  roles: ["Administradora", "Operação", "Gerência de vendas"],
};

export const adminConfigurationRecords: Record<
  AdminConfigurationSectionId,
  AdminConfigurationRecord[]
> = {
  precos: [
    {
      details: "Margem 40% · aprovação abaixo da margem obrigatória",
      id: "price-performance",
      title: "Performance",
      values: { margin: "40", name: "Performance", requiresApproval: true },
    },
    {
      details: "Margem 32% · aprovação abaixo da margem obrigatória",
      id: "price-essentials",
      title: "Essentials",
      values: { margin: "32", name: "Essentials", requiresApproval: true },
    },
    {
      details: "Margem 25% · aprovação abaixo da margem opcional",
      id: "price-accessories",
      title: "Acessórios",
      values: { margin: "25", name: "Acessórios", requiresApproval: false },
    },
  ],
  catalogos: [
    {
      details: "Marca disponível no cadastro de produtos",
      id: "catalog-nike",
      title: "Nike",
      values: { name: "Nike", type: "Marca" },
    },
    {
      details: "Categoria esportiva disponível no catálogo",
      id: "catalog-football",
      title: "Futebol",
      values: { name: "Futebol", type: "Categoria" },
    },
    {
      details: "Fornecedor disponível para entradas de estoque",
      id: "catalog-sport-supply",
      title: "Sport Supply",
      values: { name: "Sport Supply", type: "Fornecedor" },
    },
  ],
  auditoria: [
    {
      details: "23 ago. 2026, 10:32 · Produto: Bola de Futebol Pro X",
      id: "audit-product",
      title: "Marina Costa atualizou um produto",
      values: {},
    },
    {
      details: "23 ago. 2026, 09:18 · Entrada: 20 unidades",
      id: "audit-stock",
      title: "Rafael Nunes registrou entrada de estoque",
      values: {},
    },
    {
      details: "22 ago. 2026, 09:19 · Grupo: Performance",
      id: "audit-price",
      title: "Sistema recalculou o preço de venda",
      values: {},
    },
  ],
  parametros: [
    {
      details: "30 minutos · reserva expira após o último item adicionado",
      id: "parameter-reservation",
      title: "Reserva do carrinho",
      values: { name: "Reserva do carrinho", unit: "minutos", value: "30" },
    },
    {
      details: "90 dias · sem estoque e sem vendas no período",
      id: "parameter-deactivation",
      title: "Desativação automática",
      values: {
        name: "Desativação automática",
        unit: "dias",
        value: "90",
      },
    },
  ],
  usuarios: [
    {
      details: "marina@cohida.com · acesso ativo",
      id: "user-marina",
      title: "Marina Costa · Administradora",
      values: {
        active: true,
        email: "marina@cohida.com",
        name: "Marina Costa",
        role: "Administradora",
      },
    },
    {
      details: "rafael@cohida.com · acesso ativo",
      id: "user-rafael",
      title: "Rafael Nunes · Operação",
      values: {
        active: true,
        email: "rafael@cohida.com",
        name: "Rafael Nunes",
        role: "Operação",
      },
    },
  ],
};

export const adminResourceContent: Record<
  AdminResource,
  {
    action: string;
    columns: string[];
    description: string;
    heading: string;
    rows: string[][];
  }
> = {
  produtos: {
    action: "Novo produto",
    columns: ["Produto", "Categoria", "Estoque", "Preço", "Status"],
    description:
      "Gerencie o catálogo, atributos, precificação e status dos equipamentos.",
    heading: "Produtos",
    rows: adminProducts.map((product) => [
      product.name,
      product.categories.join(", "),
      `${product.stock.available} un.`,
      product.salePrice,
      product.status,
    ]),
  },
  estoque: {
    action: "Registrar entrada",
    columns: [
      "Produto",
      "Disponível",
      "Mínimo",
      "Reservado",
      "Fornecedor",
      "Alerta",
    ],
    description:
      "Acompanhe entradas, reservas, níveis disponíveis e alertas de reposição.",
    heading: "Estoque",
    rows: [
      [
        "Bola de Futebol Pro X",
        "1 un.",
        "5 un.",
        "2 un.",
        "Sport Supply",
        "Baixo",
      ],
      ["Tênis Run Flow", "4 un.", "5 un.", "1 un.", "Move Brasil", "Baixo"],
      [
        "Kit Elástico Resistance",
        "1 un.",
        "4 un.",
        "1 un.",
        "Fit Pro",
        "Baixo",
      ],
    ],
  },
  pedidos: {
    action: "Exportar pedidos",
    columns: ["Pedido", "Cliente", "Data", "Total", "Status"],
    description: "Valide pagamentos e acompanhe cada transição de fulfilment.",
    heading: "Pedidos",
    rows: [
      ["#COH-1049", "Mariana Alves", "23 ago. 2026", "R$ 99,80", "EM ABERTO"],
      [
        "#COH-1048",
        "Luana Martins",
        "23 ago. 2026",
        "R$ 429,90",
        "EM PROCESSAMENTO",
      ],
      [
        "#COH-1047",
        "Gabriel Souza",
        "23 ago. 2026",
        "R$ 1.129,00",
        "PAGAMENTO REALIZADO",
      ],
      ["#COH-1046", "Camila Rocha", "22 ago. 2026", "R$ 289,90", "EM TRÂNSITO"],
      ["#COH-1045", "Pedro Oliveira", "21 ago. 2026", "R$ 29,90", "ENTREGUE"],
    ],
  },
  clientes: {
    action: "Novo cliente",
    columns: ["Cliente", "Código", "Compras", "Perfil", "Status"],
    description:
      "Pesquise perfis, histórico de transações, endereços e status de clientes.",
    heading: "Clientes",
    rows: adminCustomers.map((customer) => [
      customer.name,
      customer.code,
      `${customer.orders} pedido${customer.orders > 1 ? "s" : ""}`,
      customer.profile,
      customer.status,
    ]),
  },
  trocas: {
    action: "Ver pendências",
    columns: ["Solicitação", "Cliente", "Pedido", "Produto", "Status"],
    description:
      "Autorize solicitações, confirme recebimentos e gere cupons de troca.",
    heading: "Trocas",
    rows: [
      [
        "#TRC-024",
        "Renato Lima",
        "#COH-1027",
        "Tênis Run Flow",
        "TROCA AUTORIZADA",
      ],
      ["#TRC-023", "Aline Castro", "#COH-1018", "Caneleira Pro", "EM TROCA"],
    ],
  },
  analises: {
    action: "Exportar planilha",
    columns: ["Categoria", "Jun.", "Jul.", "Ago.", "Variação"],
    description:
      "Compare vendas aprovadas por categoria no período selecionado.",
    heading: "Análises de vendas",
    rows: [
      ["Futebol", "R$ 8.420", "R$ 9.310", "R$ 11.900", "+27,8%"],
      ["Corrida", "R$ 7.200", "R$ 8.100", "R$ 9.870", "+21,9%"],
      ["Treino", "R$ 5.900", "R$ 6.420", "R$ 7.340", "+14,3%"],
    ],
  },
};
