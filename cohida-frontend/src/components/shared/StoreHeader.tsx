import { Menu, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";

import { AppLogo } from "@/components/shared/AppLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { PageContainer } from "./PageContainer";

interface StoreHeaderProps {
  cartItemCount?: number;
}

const links = [
  { label: "Home", to: "/" },
  { label: "Produtos", to: "/produtos" },
  { label: "Recomendações", to: "/recomendacoes" },
];

export function StoreHeader({ cartItemCount = 0 }: StoreHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <PageContainer className="relative flex h-18 items-center justify-between gap-4">
        <Link aria-label="coHida — início" className="shrink-0" to="/">
          <AppLogo className="dark:hidden" variant="dark" />
          <AppLogo className="hidden dark:block" variant="light" />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Button
              className={cn(pathname === link.to && "bg-muted")}
              key={link.to}
              render={<Link to={link.to} />}
              variant="ghost"
            >
              {link.label}
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            aria-label="Sua conta"
            render={<Link to="/conta" />}
            size="icon"
            variant="outline"
          >
            <UserRound />
          </Button>
          <Button
            aria-label={`Carrinho com ${cartItemCount} itens`}
            className="relative"
            render={<Link to="/carrinho" />}
          >
            <ShoppingBag />
            <span className="hidden sm:inline">Carrinho</span>
            {cartItemCount ? (
              <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-foreground text-xs text-background">
                {cartItemCount}
              </span>
            ) : null}
          </Button>
          <Button
            aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
            className="md:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
            size="icon"
            variant="outline"
          >
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        {isMenuOpen ? (
          <nav className="absolute top-full right-0 left-0 grid gap-1 border-b border-border bg-background p-3 shadow-lg md:hidden">
            {[...links, { label: "Minha conta", to: "/conta" }].map((link) => (
              <Button
                key={link.to}
                onClick={() => setIsMenuOpen(false)}
                render={<Link to={link.to} />}
                variant="ghost"
              >
                {link.label}
              </Button>
            ))}
          </nav>
        ) : null}
      </PageContainer>
    </header>
  );
}
