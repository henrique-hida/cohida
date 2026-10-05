import {
  Bell,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Package,
  Repeat2,
  ShoppingCart,
  Search,
  Ticket,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import { AppLogo } from "@/components/shared/AppLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCommerce } from "@/data/useCommerce";
import { hasAdminSession } from "@/lib/customerApi";
import { logout as logoutApi } from "@/lib/customerApi";
import { useCategories } from "@/data/useCategories";

import { PageContainer } from "./PageContainer";

interface StoreHeaderProps {
  cartItemCount?: number;
}

export function StoreHeader({ cartItemCount = 0 }: StoreHeaderProps) {
  const { search } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(
    () => new URLSearchParams(search).get("busca") ?? "",
  );
  const [categoryId, setCategoryId] = useState(
    () => new URLSearchParams(search).get("categoria") ?? "todas",
  );
  const { logout, state } = useCommerce();
  const categories = useCategories();
  const navigate = useNavigate();
  const adminName = hasAdminSession()
    ? localStorage.getItem("cohida-admin-name")
    : null;
  const currentCartItemCount =
    cartItemCount ||
    state.cartItems.reduce((total, item) => total + item.quantity, 0);
  const signedIn = Boolean(
    state.customer && state.sessionCustomerId === state.customer.id,
  );
  const signedInAsAdmin = Boolean(adminName);
  const accountName = signedInAsAdmin ? adminName : state.customer?.name;
  const accountInitials = accountName
    ?.trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((name) => name[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleLogout() {
    logoutApi();
    logout();
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    setSearchTerm(searchParams.get("busca") ?? "");
    setCategoryId(searchParams.get("categoria") ?? "todas");
  }, [search]);

  useEffect(() => {
    const query = searchTerm.trim();
    if (!query && categoryId === "todas") return;

    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set("busca", query);
      if (categoryId !== "todas") params.set("categoria", categoryId);
      navigate(`/produtos?${params.toString()}`);
      setIsMenuOpen(false);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [categoryId, navigate, searchTerm]);

  const searchForm = (
    <div
      className="flex w-full min-w-0 items-center gap-2 md:w-[26rem] lg:w-[34rem]"
      role="search"
    >
      <label className="sr-only" htmlFor="store-search">
        Buscar produtos
      </label>
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="h-10 w-full rounded-lg border border-input bg-background py-2 pr-3 pl-9 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          id="store-search"
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar produtos"
          value={searchTerm}
        />
      </div>
      <Select
        onValueChange={(value) => setCategoryId(value ?? "todas")}
        value={categoryId}
      >
        <SelectTrigger
          aria-label="Categoria"
          className="h-10 w-34 shrink-0 rounded-lg bg-background data-[size=default]:h-10"
          id="store-category"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" className="p-1">
          <SelectItem value="todas">Categorias</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <PageContainer className="relative grid h-18 grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Link
          aria-label="coHida — início"
          className="shrink-0 justify-self-start"
          to="/"
        >
          <AppLogo className="dark:hidden" variant="dark" />
          <AppLogo className="hidden dark:block" variant="light" />
        </Link>
        <div className="hidden min-w-0 justify-self-center md:block">
          {searchForm}
        </div>
        <div className="flex items-center gap-2 justify-self-end">
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  aria-label="Notificações"
                  size="icon"
                  variant="outline"
                />
              }
            >
              <Bell />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-4">
              <p className="font-medium">Notificações</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Você não tem novas notificações.
              </p>
            </PopoverContent>
          </Popover>
          <Button
            aria-label={`Carrinho com ${currentCartItemCount} itens`}
            className="relative"
            render={<Link to="/carrinho" />}
            size="icon"
            variant="outline"
          >
            <ShoppingCart />
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
                  aria-label={
                    signedInAsAdmin
                      ? "Menu da administradora"
                      : signedIn
                        ? "Menu da conta"
                        : "Entrar ou criar conta"
                  }
                  className="font-semibold"
                  size="icon"
                  variant="outline"
                />
              }
            >
              {accountInitials ? (
                <span className="text-xs" title={accountName ?? undefined}>
                  {accountInitials}
                </span>
              ) : (
                <UserRound />
              )}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 gap-1 p-2">
              {signedInAsAdmin ? (
                <>
                  <p className="px-2 pt-1 font-medium">{adminName}</p>
                  <p className="px-2 text-xs text-muted-foreground">Admin</p>
                  <Button
                    className="w-full justify-start"
                    render={<Link to="/admin" />}
                    variant="ghost"
                  >
                    <LayoutDashboard />
                    Ir para admin
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
                </>
              ) : signedIn ? (
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
          <div className="absolute top-full right-0 left-0 border-b border-border bg-background p-3 shadow-lg md:hidden">
            {searchForm}
          </div>
        ) : null}
      </PageContainer>
    </header>
  );
}
