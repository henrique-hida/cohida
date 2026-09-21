import {
  CircleUserRound,
  LogIn,
  LogOut,
  Database,
  Menu,
  Package,
  Repeat2,
  RotateCcw,
  ShoppingBag,
  Ticket,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";

import { AppLogo } from "@/components/shared/AppLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCommerce } from "@/data/useCommerce";
import { logout as logoutApi } from "@/lib/customerApi";
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
  const { addDemo, logout, reset, state } = useCommerce();
  const { pathname } = useLocation();
  const currentCartItemCount =
    cartItemCount ||
    state.cartItems.reduce((total, item) => total + item.quantity, 0);
  const signedIn = Boolean(
    state.customer && state.sessionCustomerId === state.customer.id,
  );

  function handleLogout() {
    logoutApi();
    logout();
  }

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
          <Button
            aria-label={`Carrinho com ${currentCartItemCount} itens`}
            className="relative"
            render={<Link to="/carrinho" />}
          >
            <ShoppingBag />
            <span className="hidden sm:inline">Carrinho</span>
            {currentCartItemCount ? (
              <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-foreground text-xs text-background">
                {currentCartItemCount}
              </span>
            ) : null}
          </Button>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  aria-label={signedIn ? "Menu da conta" : "Entrar ou criar conta"}
                  size="icon"
                  variant="outline"
                />
              }
            >
              {signedIn ? <CircleUserRound /> : <LogIn />}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 gap-1 p-2">
              {signedIn ? (
                <>
                  <p className="px-2 pt-1 font-medium">
                    {state.customer?.name}
                  </p>
                  <Button
                    className="w-full justify-start"
                    render={<Link to="/conta" />}
                    variant="ghost"
                  >
                    <UserRound />
                    Minha conta
                  </Button>
                  <Button
                    className="w-full justify-start"
                    render={<Link to="/cupons" />}
                    variant="ghost"
                  >
                    <Ticket />
                    Meus cupons
                  </Button>
                  <Button
                    className="w-full justify-start"
                    render={<Link to="/pedidos" />}
                    variant="ghost"
                  >
                    <Package />
                    Meus pedidos
                  </Button>
                  <Button
                    className="w-full justify-start"
                    render={<Link to="/trocas" />}
                    variant="ghost"
                  >
                    <Repeat2 />
                    Trocas e devoluções
                  </Button>
                  <Button
                    className="w-full justify-start"
                    onClick={handleLogout}
                    render={<Link to="/" />}
                    variant="ghost"
                  >
                    <LogOut />
                    Sair
                  </Button>
                  <Button
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={reset}
                    render={<Link to="/" />}
                    variant="ghost"
                  >
                    <RotateCcw />
                    Limpar demo
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full justify-start"
                  render={<Link to="/entrar" />}
                  variant="ghost"
                >
                  <LogIn />
                  Entrar / cadastrar-se
                </Button>
              )}
              <Button
                className="w-full justify-start"
                onClick={() => void addDemo()}
                variant="ghost"
              >
                <Database />
                Adicionar demo
              </Button>
              <div className="mt-1 flex items-center justify-between border-t border-border px-2 pt-2">
                <span className="text-sm text-muted-foreground">Tema</span>
                <ThemeToggle />
              </div>
            </PopoverContent>
          </Popover>
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
