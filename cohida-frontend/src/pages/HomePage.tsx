import { useState } from "react";
import { Link } from "react-router";
import {
  BookOpen,
  Dumbbell,
  Footprints,
  Mountain,
  Medal,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Truck,
} from "lucide-react";

import heroImage from "@/assets/CoHidaHero.png";
import { PageContainer, ProductCard, StoreHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  categories,
  homeBestSellerProductIds,
  homeGoalCollections,
  homeGuide,
  homeTestimonials,
  homeTrustMetrics,
} from "@/mocks";
import { useCommerce } from "@/data/useCommerce";

const categoryIcons = [Trophy, Footprints, Dumbbell, Mountain, Medal];

export function HomePage() {
  const { state } = useCommerce();
  const [cartItemCount, setCartItemCount] = useState(0);

  function addToCart() {
    setCartItemCount((count) => count + 1);
  }

  return (
    <div className="min-h-svh bg-background">
      <StoreHeader cartItemCount={cartItemCount} />

      <main>
        <section className="relative isolate overflow-hidden bg-[#0d0d0d] text-[#f2f2f2]">
          <div className="absolute inset-0 -z-10 bg-linear-to-r from-black via-black/80 to-transparent" />
          <img
            alt="Equipamentos esportivos coHida em estúdio"
            className="absolute inset-0 -z-20 size-full object-cover object-[70%_center]"
            src={heroImage}
          />
          <PageContainer className="flex min-h-[34rem] items-center py-20 sm:min-h-[38rem]">
            <div className="max-w-xl">
              <Badge className="mb-5" variant="default">
                Equipe seu próximo desafio
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
                Performance começa com a escolha certa.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-[#b3b3b3] sm:text-lg">
                Equipamentos esportivos selecionados para você treinar, competir
                e ir além.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button render={<Link to="/produtos" />} size="lg">
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
        </section>

        <section className="border-b border-border bg-muted/45">
          <PageContainer className="grid gap-5 py-6 sm:grid-cols-3 sm:gap-8">
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
                <div className="flex items-center gap-3" key={benefit.title}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-background text-primary ring-1 ring-border">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{benefit.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {benefit.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </PageContainer>
        </section>

        <PageContainer className="py-16 sm:py-24">
          <section id="categorias">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-primary">
                  Encontre seu esporte
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  Categorias para acompanhar seu ritmo
                </h2>
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {categories.map((category, index) => {
                const Icon = categoryIcons[index];

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

          <section className="mt-20" id="destaques">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-primary">
                  Favoritos da comunidade
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  Produtos em destaque
                </h2>
              </div>
              <Button render={<Link to="/produtos" />} variant="outline">
                Ver catálogo
              </Button>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {state.products.map((product) => (
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
                <p className="text-sm font-medium text-primary">
                  Em alta esta semana
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  Os mais escolhidos pela comunidade
                </h2>
              </div>
              <Button render={<Link to="/produtos" />} variant="outline">
                Ver todos
              </Button>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {homeBestSellerProductIds.map((productId, index) => {
                const product = state.products.find(
                  (item) => item.id === productId,
                );
                return product ? (
                  <Link
                    className="group flex gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
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
                ) : null;
              })}
            </div>
          </section>

          <section className="mt-20">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-primary">
                Escolha pelo objetivo
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
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
                    className="group relative min-h-64 overflow-hidden rounded-2xl bg-foreground p-6 text-background"
                    key={collection.title}
                    to={`/produtos/${firstProduct?.slug ?? ""}`}
                  >
                    <img
                      alt=""
                      className="absolute inset-0 size-full object-cover opacity-35 transition-transform duration-500 group-hover:scale-105"
                      src={firstProduct?.images[0]?.src}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="relative flex h-full flex-col justify-end">
                      <h3 className="text-xl font-semibold">
                        {collection.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/75">
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
              <p className="mt-6 text-sm font-medium text-primary">
                Conteúdo para evoluir
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
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
            <div className="grid gap-4 rounded-2xl bg-muted p-6 sm:grid-cols-3 sm:p-8">
              {homeTrustMetrics.map((metric) => (
                <div key={metric.label}>
                  <p className="text-2xl font-semibold tracking-tight">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {metric.label}
                  </p>
                </div>
              ))}
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
            <p className="text-sm font-medium text-primary">
              Feita para se mover
            </p>
            <div className="mt-3 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight">
                A coHida une desempenho, qualidade e equipamento para sua rotina
                esportiva.
              </h2>
              <Button render={<a href="mailto:contato@cohida.com" />} size="lg">
                Fale com a gente
              </Button>
            </div>
          </section>
        </PageContainer>
      </main>
    </div>
  );
}
