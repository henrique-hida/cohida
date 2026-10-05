import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Footprints,
  HeartHandshake,
  Mountain,
  Medal,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Truck,
  UsersRound,
} from "lucide-react";

import heroImage from "@/assets/CoHidaHero.png";
import collectionFootballImage from "@/assets/CoHidaCollectionFootball.png";
import collectionRunningImage from "@/assets/CoHidaCollectionRunning.png";
import collectionTrainingImage from "@/assets/CoHidaCollectionTraining.png";
import heroFootballImage from "@/assets/CoHidaHeroFootball.png";
import heroMartialArtsImage from "@/assets/CoHidaHeroMartialArts.png";
import { PageContainer, ProductCard, StoreHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  homeGoalCollections,
  homeGuide,
  homeTestimonials,
  homeTrustMetrics,
} from "@/mocks";
import { useCommerce } from "@/data/useCommerce";
import { useCategories } from "@/data/useCategories";

const categoryIcons = [Trophy, Footprints, Dumbbell, Mountain, Medal];
const trustIcons = [UsersRound, Star, HeartHandshake];

const collectionImages: Record<string, string> = {
  "Começar a correr": collectionRunningImage,
  "Jogar futebol": collectionFootballImage,
  "Montar treino em casa": collectionTrainingImage,
};

const heroSlides = [
  {
    alt: "Equipamentos esportivos coHida em estúdio",
    categoryId: undefined,
    description:
      "Equipamentos esportivos selecionados para você treinar, competir e ir além.",
    eyebrow: "Equipe seu próximo desafio",
    image: heroImage,
    title: "Performance começa com a escolha certa.",
  },
  {
    alt: "Chuteiras, bola e camiseta de futebol em estúdio",
    categoryId: "football",
    description:
      "Chuteiras, bolas e acessórios para você entrar em campo preparado.",
    eyebrow: "Futebol",
    image: heroFootballImage,
    title: "Seu jogo começa antes do apito.",
  },
  {
    alt: "Judogi, faixa e luvas de artes marciais em estúdio",
    categoryId: "martial-arts",
    description:
      "Equipamentos para acompanhar sua evolução em cada treino no tatame.",
    eyebrow: "Artes marciais",
    image: heroMartialArtsImage,
    title: "Disciplina para ir além no tatame.",
  },
];

export function HomePage() {
  const { state } = useCommerce();
  const categories = useCategories();
  const [cartItemCount, setCartItemCount] = useState(0);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const recommendationsCarouselRef = useRef<HTMLDivElement>(null);
  const communityCarouselRef = useRef<HTMLDivElement>(null);

  function addToCart() {
    setCartItemCount((count) => count + 1);
  }

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveHeroIndex((index) => (index + 1) % heroSlides.length);
    }, 6500);

    return () => window.clearInterval(intervalId);
  }, []);

  function scrollCarousel(
    carousel: React.RefObject<HTMLDivElement | null>,
    direction: -1 | 1,
  ) {
    carousel.current?.scrollBy({
      behavior: "smooth",
      left: carousel.current.clientWidth * direction * 0.85,
    });
  }

  const activeHero = heroSlides[activeHeroIndex];

  function changeHero(direction: -1 | 1) {
    setActiveHeroIndex(
      (index) => (index + direction + heroSlides.length) % heroSlides.length,
    );
  }

  return (
    <div className="min-h-svh bg-background">
      <StoreHeader cartItemCount={cartItemCount} />

      <main>
        <section className="relative isolate overflow-hidden bg-[#0d0d0d] text-[#f2f2f2]">
          <div className="absolute inset-0 -z-10 bg-linear-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-linear-to-b from-transparent via-background/45 to-background" />
          {heroSlides.map((slide, index) => (
            <img
              alt={slide.alt}
              className={`absolute inset-0 -z-20 size-full object-cover object-[70%_center] transition-opacity duration-700 ${
                activeHeroIndex === index ? "opacity-100" : "opacity-0"
              }`}
              key={slide.image}
              src={slide.image}
            />
          ))}
          <PageContainer className="flex h-[34rem] items-center pb-36 pt-20 sm:h-[38rem] sm:pb-44">
            <div className="max-w-xl">
              <Badge className="mb-5" variant="default">
                {activeHero.eyebrow}
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
                {activeHero.title}
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-[#b3b3b3] sm:text-lg">
                {activeHero.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  render={
                    <Link
                      to={
                        activeHero.categoryId
                          ? `/produtos?categoria=${activeHero.categoryId}`
                          : "/produtos"
                      }
                    />
                  }
                  size="lg"
                >
                  Ver destaques
                </Button>
                <Button
                  className="border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  render={<a href="#categorias" />}
                  size="lg"
                  variant="outline"
                >
                  Explorar categorias
                </Button>
              </div>
            </div>
          </PageContainer>
          <div className="absolute inset-x-0 top-1/2 z-10 hidden -translate-y-1/2 justify-between px-5 lg:flex">
            <Button
              aria-label="Banner anterior"
              className="size-12 rounded-full border-white/25 bg-black/35 text-white backdrop-blur hover:bg-white/15 hover:text-white"
              onClick={() => changeHero(-1)}
              size="icon"
              variant="outline"
            >
              <ChevronLeft />
            </Button>
            <Button
              aria-label="Próximo banner"
              className="size-12 rounded-full border-white/25 bg-black/35 text-white backdrop-blur hover:bg-white/15 hover:text-white"
              onClick={() => changeHero(1)}
              size="icon"
              variant="outline"
            >
              <ChevronRight />
            </Button>
          </div>
          <div className="absolute right-0 bottom-40 left-0 z-10 flex justify-center gap-2 sm:bottom-48">
            {heroSlides.map((slide, index) => (
              <button
                aria-label={`Exibir banner ${index + 1}`}
                aria-current={activeHeroIndex === index ? "true" : undefined}
                className={`h-2 rounded-full transition-all ${
                  activeHeroIndex === index
                    ? "w-7 bg-primary"
                    : "w-2 bg-white/60 hover:bg-white"
                }`}
                key={slide.image}
                onClick={() => setActiveHeroIndex(index)}
                type="button"
              />
            ))}
          </div>
        </section>

        <section
          className="relative z-10 -mt-28 pb-10 sm:-mt-32 sm:pb-16"
          id="destaques"
        >
          <PageContainer>
            <div className="relative">
              <div
                className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                ref={recommendationsCarouselRef}
              >
                {state.products.slice(4, 10).map((product) => (
                  <div
                    className="w-72 shrink-0 snap-start sm:w-80"
                    key={product.id}
                  >
                    <ProductCard
                      categoryName={
                        categories.find(
                          (category) => category.id === product.categoryIds[0],
                        )?.name
                      }
                      onAddToCart={addToCart}
                      product={product}
                    />
                  </div>
                ))}
              </div>
              <Button
                aria-label="Ver recomendações anteriores"
                className="absolute top-1/2 left-0 z-10 size-10 -translate-y-1/2 rounded-full bg-background text-primary shadow-lg hover:bg-muted sm:-left-6 sm:size-14"
                onClick={() => scrollCarousel(recommendationsCarouselRef, -1)}
                size="icon"
                variant="outline"
              >
                <ChevronLeft />
              </Button>
              <Button
                aria-label="Ver próximas recomendações"
                className="absolute top-1/2 right-0 z-10 size-10 -translate-y-1/2 rounded-full bg-background text-primary shadow-lg hover:bg-muted sm:-right-6 sm:size-14"
                onClick={() => scrollCarousel(recommendationsCarouselRef, 1)}
                size="icon"
                variant="outline"
              >
                <ChevronRight />
              </Button>
            </div>
          </PageContainer>
        </section>

        <PageContainer className="pt-8 pb-16 sm:pt-12 sm:pb-24">
          <section id="categorias">
            <div className="flex items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">
                  Categorias para acompanhar seu ritmo
                </h2>
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {categories.map((category, index) => {
                const Icon = categoryIcons[index % categoryIcons.length];

                return (
                  <Link
                    className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
                    key={category.id}
                    to={`/produtos?categoria=${category.id}`}
                  >
                    <span className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <h3 className="mt-5 font-semibold">{category.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {category.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mt-20">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">
                  Produtos em destaque
                </h2>
              </div>
              <Button render={<Link to="/produtos" />} variant="outline">
                Ver catálogo
              </Button>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {state.products.slice(0, 4).map((product) => (
                <ProductCard
                  categoryName={
                    categories.find(
                      (category) => category.id === product.categoryIds[0],
                    )?.name
                  }
                  key={product.id}
                  onAddToCart={addToCart}
                  product={product}
                />
              ))}
            </div>
          </section>

          <section className="mt-20">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">
                  Os mais escolhidos pela comunidade
                </h2>
              </div>
              <Button render={<Link to="/produtos" />} variant="outline">
                Ver todos
              </Button>
            </div>
            <div className="relative mt-8">
              <div
                className="-mx-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-3 py-3 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                ref={communityCarouselRef}
              >
                {state.products.slice(1, 7).map((product, index) => (
                  <Link
                    className="group flex w-72 shrink-0 snap-start gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
                    key={product.id}
                    to={`/produtos/${product.slug}`}
                  >
                    <img
                      alt={product.images[0]?.alt}
                      className="size-20 rounded-lg object-cover"
                      src={product.images[0]?.src}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-primary">
                        #{index + 1} em alta
                      </p>
                      <h3 className="mt-1 font-semibold">{product.name}</h3>
                      <p className="mt-2 text-sm font-medium">
                        R${" "}
                        {(product.priceCents / 100).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <Button
                aria-label="Ver produtos anteriores escolhidos pela comunidade"
                className="absolute top-1/2 left-0 z-10 size-10 -translate-y-1/2 rounded-full bg-background text-primary shadow-lg hover:bg-muted sm:-left-6 sm:size-14"
                onClick={() => scrollCarousel(communityCarouselRef, -1)}
                size="icon"
                variant="outline"
              >
                <ChevronLeft />
              </Button>
              <Button
                aria-label="Ver próximos produtos escolhidos pela comunidade"
                className="absolute top-1/2 right-0 z-10 size-10 -translate-y-1/2 rounded-full bg-background text-primary shadow-lg hover:bg-muted sm:-right-6 sm:size-14"
                onClick={() => scrollCarousel(communityCarouselRef, 1)}
                size="icon"
                variant="outline"
              >
                <ChevronRight />
              </Button>
            </div>
          </section>

          <section className="mt-20">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight">
                Um ponto de partida para cada desafio
              </h2>
            </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {homeGoalCollections.map((collection) => {
                const firstProduct = state.products.find(
                  (product) => product.id === collection.productIds[0],
                );
                return (
                  <Link
                    className="group relative min-h-64 overflow-hidden rounded-2xl border border-border bg-card"
                    key={collection.title}
                    to={`/produtos/${firstProduct?.slug ?? ""}`}
                  >
                    <img
                      alt={`Seleção ${collection.title}`}
                      className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      src={collectionImages[collection.title]}
                    />
                    <div className="absolute right-4 bottom-4 left-4 rounded-xl bg-background/92 p-4 shadow-lg ring-1 ring-border/70 backdrop-blur-sm">
                      <h3 className="text-xl font-semibold">
                        {collection.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {collection.description}
                      </p>
                      <span className="mt-5 text-sm font-medium text-primary">
                        Ver seleção
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mt-20 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,.85fr)]">
            <article className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <BookOpen className="size-5" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold tracking-tight">
                {homeGuide.title}
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
                {homeGuide.description}
              </p>
              <Button
                className="mt-6"
                render={<Link to="/produtos?categoria=running" />}
                variant="outline"
              >
                Ler guia e ver opções
              </Button>
            </article>
            <article className="rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8">
              <Sparkles className="size-6" />
              <h2 className="mt-6 text-2xl font-semibold tracking-tight">
                Não sabe por onde começar?
              </h2>
              <p className="mt-3 leading-7 text-primary-foreground/80">
                Conte seu objetivo ao assistente coHida e receba uma seleção
                para sua rotina.
              </p>
              <p className="mt-6 text-sm font-medium">
                Abra o assistente no canto da tela.
              </p>
            </article>
          </section>

          <section className="mt-20">
            <div className="rounded-3xl border border-border bg-linear-to-br from-primary/15 via-muted to-background p-3 sm:p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {homeTrustMetrics.map((metric, index) => {
                  const Icon = trustIcons[index] ?? Medal;

                  return (
                    <article
                      className="rounded-2xl border border-background/80 bg-background/85 p-6 shadow-sm backdrop-blur sm:p-7"
                      key={metric.label}
                    >
                      <span className="grid size-11 place-items-center rounded-xl bg-primary/12 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <p className="mt-6 text-3xl font-semibold tracking-tight">
                        {metric.value}
                      </p>
                      <p className="mt-2 text-sm font-medium text-muted-foreground">
                        {metric.label}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {homeTestimonials.map((testimonial) => (
                <article
                  className="rounded-xl border border-border bg-card p-5"
                  key={testimonial.name}
                >
                  <div className="flex gap-1 text-primary">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star className="size-3 fill-current" key={index} />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-sm leading-6">
                    “{testimonial.quote}”
                  </blockquote>
                  <p className="mt-5 text-sm font-medium">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.sport}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section
            className="mt-20 rounded-2xl bg-foreground px-6 py-12 text-background sm:px-12"
            id="sobre"
          >
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight">
              A coHida une desempenho, qualidade e equipamento para sua rotina
              esportiva.
            </h2>
          </section>
        </PageContainer>
        <section className="border-t border-border bg-muted/45">
          <PageContainer className="grid gap-7 py-10 sm:grid-cols-3 sm:gap-10 sm:py-14">
            {[
              {
                icon: Truck,
                text: "Entrega para todo o Brasil",
                title: "Pronto para chegar",
              },
              {
                icon: RotateCcw,
                text: "Solicitação simples pela sua conta",
                title: "Troca descomplicada",
              },
              {
                icon: ShieldCheck,
                text: "Pagamento e dados protegidos",
                title: "Compra segura",
              },
            ].map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div className="flex items-center gap-4" key={benefit.title}>
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-background text-primary ring-1 ring-border">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-medium">{benefit.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {benefit.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </PageContainer>
        </section>
      </main>
    </div>
  );
}
