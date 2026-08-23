export interface HomeGoalCollection {
  description: string;
  productIds: string[];
  title: string;
}

export interface HomeTestimonial {
  name: string;
  quote: string;
  sport: string;
}

export const homeBestSellerProductIds = [
  "powerband-set",
  "velocity-runner",
  "ball-strike-pro",
];

export const homeGoalCollections: HomeGoalCollection[] = [
  {
    description: "O essencial para ganhar ritmo com conforto e consistência.",
    productIds: ["velocity-runner", "trail-pack-18l"],
    title: "Começar a correr",
  },
  {
    description: "Mobilidade, força e versatilidade para sua rotina em casa.",
    productIds: ["powerband-set"],
    title: "Montar treino em casa",
  },
  {
    description: "Equipamentos resistentes para jogo, técnica e intensidade.",
    productIds: ["ball-strike-pro"],
    title: "Jogar futebol",
  },
];

export const homeGuide = {
  description:
    "Entenda amortecimento, ajuste e tipo de treino antes de escolher seu próximo par.",
  title: "Guia rápido: como escolher seu tênis de corrida",
};

export const homeTestimonials: HomeTestimonial[] = [
  {
    name: "Marina Alves",
    quote:
      "Encontrei exatamente o que precisava para voltar a correr com confiança.",
    sport: "Corrida",
  },
  {
    name: "Lucas Ferreira",
    quote:
      "A recomendação facilitou muito montar um kit funcional sem exageros.",
    sport: "Treino funcional",
  },
  {
    name: "Ana Costa",
    quote: "Entrega rápida e produto ainda melhor do que eu esperava.",
    sport: "Futebol",
  },
];

export const homeTrustMetrics = [
  { label: "atletas equipados", value: "+12 mil" },
  { label: "avaliação média", value: "4,8 / 5" },
  { label: "de satisfação", value: "98%" },
];
