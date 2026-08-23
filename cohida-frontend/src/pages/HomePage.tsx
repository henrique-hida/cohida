import { useState } from "react";
import { Link } from "react-router";
import {
  CircleUserRound,
  Dumbbell,
  Footprints,
  Menu,
  Mountain,
  ShoppingBag,
  Trophy,
} from "lucide-react";

import heroImage from "@/assets/CoHidaHero.png";
import {
  AppLogo,
  PageContainer,
  ProductCard,
  ThemeToggle,
} from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categories, products } from "@/mocks";

const categoryIcons = [Trophy, Footprints, Dumbbell, Mountain];

export function HomePage() {
  const [cartItemCount, setCartItemCount] = useState(0);

  function addToCart() {
    setCartItemCount((count) => count + 1);
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <PageContainer className="flex h-18 items-center justify-between gap-4">
          <Link aria-label="coHida — início" className="shrink-0" to="/">
            <AppLogo className="dark:hidden" variant="dark" />
            <AppLogo className="hidden dark:block" variant="light" />
          </Link>

          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-6 text-sm font-medium md:flex"
          >
            <a
              className="transition-colors hover:text-primary"
              href="#categorias"
            >
              Categorias
            </a>
            <a
              className="transition-colors hover:text-primary"
              href="#destaques"
            >
              Destaques
            </a>
            <a className="transition-colors hover:text-primary" href="#sobre">
              Sobre a coHida
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button render={<Link to="/admin/login" />} variant="outline">
              <CircleUserRound aria-hidden="true" />
              <span className="hidden sm:inline">Perfil</span>
            </Button>
            <Button
              aria-label={`Carrinho com ${cartItemCount} itens`}
              className="relative"
              variant="default"
            >
              <ShoppingBag aria-hidden="true" />
              <span className="hidden sm:inline">Carrinho</span>
              {cartItemCount > 0 ? (
                <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-foreground text-xs text-background">
                  {cartItemCount}
                </span>
              ) : null}
            </Button>
            <Button
              aria-label="Abrir menu"
              className="md:hidden"
              size="icon"
              variant="outline"
            >
              <Menu aria-hidden="true" />
            </Button>
          </div>
        </PageContainer>
      </header>

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
                <Button render={<a href="#destaques" />} size="lg">
                  Ver destaques
                </Button>
                <Button
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
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category, index) => {
                const Icon = categoryIcons[index];

                return (
                  <a
                    className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
                    href={`#${category.slug}`}
                    key={category.id}
                  >
                    <span className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <h3 className="mt-5 font-semibold">{category.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {category.description}
                    </p>
                  </a>
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
              <Button render={<a href="#catalogo" />} variant="outline">
                Ver catálogo
              </Button>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
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
