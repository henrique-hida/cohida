import type { Product } from "@/types";
import ballImage from "@/assets/products/bola-strike-pro.png";
import apexFieldImage from "@/assets/products/chuteira-apex-field.png";
import matchTrainingImage from "@/assets/products/camiseta-match-training.png";
import thermalBottleImage from "@/assets/products/garrafa-termica-700ml.png";
import judogiImage from "@/assets/products/judogi-essencial.png";
import powerbandImage from "@/assets/products/kit-powerband.png";
import trailHeadlampImage from "@/assets/products/lanterna-trail-beam.png";
import trailPackImage from "@/assets/products/mochila-trail-18l.png";
import trailSocksImage from "@/assets/products/meia-trail-performance.png";
import judoBeltImage from "@/assets/products/faixa-judo-verde.png";
import paceWatchImage from "@/assets/products/relogio-pace.png";
import runnerImage from "@/assets/products/tenis-velocity-runner.png";
import flowMatImage from "@/assets/products/tapete-flow.png";
import windShellImage from "@/assets/products/jaqueta-wind-shell.png";

export const products: Product[] = [
  {
    id: "ball-strike-pro",
    sku: "CH-BAL-001",
    slug: "bola-strike-pro",
    name: "Bola Strike Pro",
    brand: "coHida",
    description:
      "Bola de futebol com construção resistente para partidas intensas.",
    priceCents: 14990,
    compareAtPriceCents: 17990,
    rating: 4.8,
    reviewCount: 124,
    status: "active",
    categoryIds: ["football"],
    images: [
      {
        id: "ball-strike-pro-main",
        alt: "Bola Strike Pro branca e verde",
        src: ballImage,
      },
    ],
    variants: [
      {
        id: "ball-strike-pro-standard",
        sku: "CH-BAL-001-STD",
        label: "Tamanho padrão",
        stockQuantity: 24,
      },
    ],
    attributes: {
      material: "PU texturizado",
      weight: "420 g",
      color: "Branco e verde",
    },
    createdAt: "2026-08-16T12:00:00.000Z",
  },
  {
    id: "velocity-runner",
    sku: "CH-RUN-001",
    slug: "tenis-velocity-runner",
    name: "Tênis Velocity Runner",
    brand: "coHida",
    description:
      "Tênis leve com amortecimento responsivo para treinos e corridas diárias.",
    priceCents: 39990,
    rating: 4.7,
    reviewCount: 86,
    status: "active",
    categoryIds: ["running"],
    images: [
      {
        id: "velocity-runner-main",
        alt: "Tênis Velocity Runner preto",
        src: runnerImage,
      },
    ],
    variants: [
      {
        id: "velocity-runner-39",
        sku: "CH-RUN-001-39",
        label: "39",
        size: "39",
        stockQuantity: 8,
      },
      {
        id: "velocity-runner-40",
        sku: "CH-RUN-001-40",
        label: "40",
        size: "40",
        stockQuantity: 11,
      },
      {
        id: "velocity-runner-41",
        sku: "CH-RUN-001-41",
        label: "41",
        size: "41",
        stockQuantity: 7,
      },
    ],
    attributes: { material: "Mesh respirável", drop: "8 mm", color: "Preto" },
    createdAt: "2026-08-16T12:00:00.000Z",
  },
  {
    id: "powerband-set",
    sku: "CH-TRN-001",
    slug: "kit-powerband",
    name: "Kit PowerBand",
    brand: "coHida",
    description:
      "Três faixas de resistência para ativação, mobilidade e treino funcional.",
    priceCents: 8990,
    rating: 4.9,
    reviewCount: 211,
    status: "active",
    categoryIds: ["training"],
    images: [
      {
        id: "powerband-main",
        alt: "Kit PowerBand de faixas verdes",
        src: powerbandImage,
      },
    ],
    variants: [
      {
        id: "powerband-set-standard",
        sku: "CH-TRN-001-STD",
        label: "Kit com 3 faixas",
        stockQuantity: 36,
      },
    ],
    attributes: {
      material: "Látex natural",
      resistance: "Leve, média e forte",
      color: "Verde",
    },
    createdAt: "2026-08-16T12:00:00.000Z",
  },
  {
    id: "trail-pack-18l",
    sku: "CH-OUT-001",
    slug: "mochila-trail-18l",
    name: "Mochila Trail 18L",
    brand: "coHida",
    description:
      "Mochila compacta para trilhas curtas, com bolsos de acesso rápido.",
    priceCents: 22990,
    rating: 4.6,
    reviewCount: 63,
    status: "active",
    categoryIds: ["outdoor"],
    images: [
      {
        id: "trail-pack-main",
        alt: "Mochila Trail 18L verde escura",
        src: trailPackImage,
      },
    ],
    variants: [
      {
        id: "trail-pack-18l-green",
        sku: "CH-OUT-001-GRN",
        label: "Verde",
        color: "Verde",
        stockQuantity: 15,
      },
    ],
    attributes: {
      capacity: "18 L",
      material: "Poliéster reciclado",
      color: "Verde escuro",
    },
    createdAt: "2026-08-16T12:00:00.000Z",
  },
  {
    id: "apex-field-boot",
    sku: "CH-FTB-002",
    slug: "chuteira-apex-field",
    name: "Chuteira Apex Field",
    brand: "coHida",
    description: "Chuteira de campo com trava firme e ajuste confortável.",
    priceCents: 25990,
    rating: 4.7,
    reviewCount: 94,
    status: "active",
    categoryIds: ["football"],
    images: [
      {
        id: "apex-field-main",
        alt: "Chuteira Apex Field preta",
        src: apexFieldImage,
      },
    ],
    variants: [
      {
        id: "apex-field-39",
        sku: "CH-FTB-002-39",
        label: "39",
        size: "39",
        stockQuantity: 6,
      },
      {
        id: "apex-field-40",
        sku: "CH-FTB-002-40",
        label: "40",
        size: "40",
        stockQuantity: 9,
      },
      {
        id: "apex-field-41",
        sku: "CH-FTB-002-41",
        label: "41",
        size: "41",
        stockQuantity: 4,
      },
    ],
    attributes: {
      material: "Sintético texturizado",
      surface: "Campo",
      color: "Preto",
    },
    createdAt: "2026-08-18T12:00:00.000Z",
  },
  {
    id: "match-training-shirt",
    sku: "CH-FTB-003",
    slug: "camiseta-match-training",
    name: "Camiseta Match Training",
    brand: "coHida",
    description: "Camiseta leve para treinos, jogos e atividades ao ar livre.",
    priceCents: 9990,
    compareAtPriceCents: 11990,
    rating: 4.5,
    reviewCount: 57,
    status: "active",
    categoryIds: ["football", "training"],
    images: [
      {
        id: "match-training-main",
        alt: "Camiseta Match Training verde",
        src: matchTrainingImage,
      },
    ],
    variants: [
      {
        id: "match-training-m",
        sku: "CH-FTB-003-M",
        label: "M",
        size: "M",
        stockQuantity: 13,
      },
      {
        id: "match-training-g",
        sku: "CH-FTB-003-G",
        label: "G",
        size: "G",
        stockQuantity: 10,
      },
    ],
    attributes: { material: "Poliéster dry", fit: "Regular", color: "Verde" },
    createdAt: "2026-08-18T12:00:00.000Z",
  },
  {
    id: "thermal-bottle-700",
    sku: "CH-TRN-002",
    slug: "garrafa-termica-700ml",
    name: "Garrafa Térmica 700 ml",
    brand: "coHida",
    description:
      "Garrafa resistente para manter sua hidratação sempre por perto.",
    priceCents: 7990,
    rating: 4.8,
    reviewCount: 173,
    status: "active",
    categoryIds: ["training", "outdoor"],
    images: [
      {
        id: "thermal-bottle-main",
        alt: "Garrafa térmica verde",
        src: thermalBottleImage,
      },
    ],
    variants: [
      {
        id: "thermal-bottle-green",
        sku: "CH-TRN-002-GRN",
        label: "Verde",
        color: "Verde",
        stockQuantity: 28,
      },
    ],
    attributes: { capacity: "700 ml", material: "Aço inox", color: "Verde" },
    createdAt: "2026-08-19T12:00:00.000Z",
  },
  {
    id: "flow-mat",
    sku: "CH-TRN-003",
    slug: "tapete-flow",
    name: "Tapete Flow",
    brand: "coHida",
    description:
      "Tapete antiderrapante para mobilidade, yoga e treino funcional.",
    priceCents: 12990,
    rating: 4.6,
    reviewCount: 88,
    status: "active",
    categoryIds: ["training"],
    images: [
      {
        id: "flow-mat-main",
        alt: "Tapete Flow para treino",
        src: flowMatImage,
      },
    ],
    variants: [
      {
        id: "flow-mat-standard",
        sku: "CH-TRN-003-STD",
        label: "Tamanho único",
        stockQuantity: 0,
      },
    ],
    attributes: { thickness: "6 mm", material: "TPE", color: "Grafite" },
    createdAt: "2026-08-19T12:00:00.000Z",
  },
  {
    id: "pace-watch",
    sku: "CH-RUN-002",
    slug: "relogio-pace",
    name: "Relógio Pace",
    brand: "coHida",
    description: "Relógio esportivo para acompanhar tempo, ritmo e evolução.",
    priceCents: 49990,
    rating: 4.7,
    reviewCount: 46,
    status: "active",
    categoryIds: ["running"],
    images: [
      {
        id: "pace-watch-main",
        alt: "Relógio Pace esportivo",
        src: paceWatchImage,
      },
    ],
    variants: [
      {
        id: "pace-watch-black",
        sku: "CH-RUN-002-BLK",
        label: "Preto",
        color: "Preto",
        stockQuantity: 7,
      },
    ],
    attributes: { battery: "Até 7 dias", resistance: "5 ATM", color: "Preto" },
    createdAt: "2026-08-20T12:00:00.000Z",
  },
  {
    id: "trail-socks",
    sku: "CH-RUN-003",
    slug: "meia-trail-performance",
    name: "Meia Trail Performance",
    brand: "coHida",
    description: "Meia de cano médio com ventilação para treinos longos.",
    priceCents: 3990,
    rating: 4.9,
    reviewCount: 208,
    status: "active",
    categoryIds: ["running", "outdoor"],
    images: [
      {
        id: "trail-socks-main",
        alt: "Meia Trail Performance",
        src: trailSocksImage,
      },
    ],
    variants: [
      {
        id: "trail-socks-39-42",
        sku: "CH-RUN-003-39-42",
        label: "39–42",
        size: "39–42",
        stockQuantity: 42,
      },
    ],
    attributes: { material: "Poliamida", fit: "39–42", color: "Preto" },
    createdAt: "2026-08-20T12:00:00.000Z",
  },
  {
    id: "trail-headlamp",
    sku: "CH-OUT-002",
    slug: "lanterna-trail-beam",
    name: "Lanterna Trail Beam",
    brand: "coHida",
    description:
      "Lanterna recarregável para trilhas ao amanhecer ou após o pôr do sol.",
    priceCents: 15990,
    rating: 4.6,
    reviewCount: 39,
    status: "active",
    categoryIds: ["outdoor"],
    images: [
      {
        id: "trail-headlamp-main",
        alt: "Lanterna Trail Beam",
        src: trailHeadlampImage,
      },
    ],
    variants: [
      {
        id: "trail-headlamp-standard",
        sku: "CH-OUT-002-STD",
        label: "Tamanho único",
        stockQuantity: 12,
      },
    ],
    attributes: {
      power: "350 lúmens",
      battery: "USB-C",
      color: "Verde escuro",
    },
    createdAt: "2026-08-21T12:00:00.000Z",
  },
  {
    id: "wind-shell-jacket",
    sku: "CH-OUT-003",
    slug: "jaqueta-wind-shell",
    name: "Jaqueta Wind Shell",
    brand: "coHida",
    description:
      "Camada leve contra o vento para corrida, trilha e deslocamentos.",
    priceCents: 21990,
    rating: 4.5,
    reviewCount: 71,
    status: "active",
    categoryIds: ["outdoor", "running"],
    images: [
      {
        id: "wind-shell-main",
        alt: "Jaqueta Wind Shell verde",
        src: windShellImage,
      },
    ],
    variants: [
      {
        id: "wind-shell-p",
        sku: "CH-OUT-003-P",
        label: "P",
        size: "P",
        stockQuantity: 5,
      },
      {
        id: "wind-shell-m",
        sku: "CH-OUT-003-M",
        label: "M",
        size: "M",
        stockQuantity: 9,
      },
      {
        id: "wind-shell-g",
        sku: "CH-OUT-003-G",
        label: "G",
        size: "G",
        stockQuantity: 6,
      },
    ],
    attributes: {
      material: "Nylon ripstop",
      protection: "Corta-vento",
      color: "Verde escuro",
    },
    createdAt: "2026-08-21T12:00:00.000Z",
  },
  {
    id: "judogi-essential",
    sku: "CH-JDO-001",
    slug: "judogi-essencial",
    name: "Judogi Essencial",
    brand: "coHida",
    description: "Kimono de judô resistente para treinos frequentes no tatame.",
    priceCents: 28990,
    rating: 4.8,
    reviewCount: 64,
    status: "active",
    categoryIds: ["martial-arts"],
    images: [
      {
        id: "judogi-essential-main",
        alt: "Judogi Essencial branco",
        src: judogiImage,
      },
    ],
    variants: [
      {
        id: "judogi-essential-a2",
        sku: "CH-JDO-001-A2",
        label: "A2",
        size: "A2",
        stockQuantity: 8,
      },
      {
        id: "judogi-essential-a3",
        sku: "CH-JDO-001-A3",
        label: "A3",
        size: "A3",
        stockQuantity: 11,
      },
      {
        id: "judogi-essential-a4",
        sku: "CH-JDO-001-A4",
        label: "A4",
        size: "A4",
        stockQuantity: 5,
      },
    ],
    attributes: {
      material: "Algodão trançado",
      weight: "550 g/m²",
      color: "Branco",
    },
    createdAt: "2026-08-22T12:00:00.000Z",
  },
  {
    id: "judo-belt-green",
    sku: "CH-JDO-002",
    slug: "faixa-judo-verde",
    name: "Faixa de Judô Verde",
    brand: "coHida",
    description: "Faixa reforçada para acompanhar cada etapa da sua graduação.",
    priceCents: 4990,
    rating: 4.9,
    reviewCount: 102,
    status: "active",
    categoryIds: ["martial-arts"],
    images: [
      { id: "judo-belt-main", alt: "Faixa de judô verde", src: judoBeltImage },
    ],
    variants: [
      {
        id: "judo-belt-280",
        sku: "CH-JDO-002-280",
        label: "280 cm",
        size: "280 cm",
        stockQuantity: 22,
      },
    ],
    attributes: { material: "Algodão", length: "280 cm", color: "Verde" },
    createdAt: "2026-08-22T12:00:00.000Z",
  },
];
