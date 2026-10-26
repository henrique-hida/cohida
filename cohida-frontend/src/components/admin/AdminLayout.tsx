import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ClipboardList,
  Ticket,
  LayoutDashboard,
  Package,
  Repeat2,
  Settings,
  LogOut,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Link, Navigate, NavLink, useLocation } from "react-router";

import { AppLogo } from "@/components/shared";
import { AccountMenu } from "@/components/shared/AccountMenu";
import { Button } from "@/components/ui/button";
import {
  getSavedAccounts,
  hasAdminSession,
  switchAccount,
} from "@/lib/customerApi";
import { cn } from "@/lib/utils";

const navigation = [
  { icon: LayoutDashboard, label: "Visão geral", to: "/admin" },
  { icon: Package, label: "Produtos", to: "/admin/produtos" },
  { icon: Boxes, label: "Estoque", to: "/admin/estoque" },
  { icon: ClipboardList, label: "Pedidos", to: "/admin/pedidos" },
  { icon: UsersRound, label: "Clientes", to: "/admin/clientes" },
  { icon: Repeat2, label: "Trocas", to: "/admin/trocas" },
  { icon: Ticket, label: "Cupons", to: "/admin/cupons" },
  { icon: BarChart3, label: "Análises", to: "/admin/analises" },
  { icon: Settings, label: "Administração", to: "/admin/administracao" },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  if (!hasAdminSession()) {
    return <Navigate replace to="/entrar" />;
  }

  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const adminName =
    localStorage.getItem("cohida-admin-name") ?? "Administradora";
  const savedAccounts = getSavedAccounts();
  const { pathname } = useLocation();
  const itemRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [indicator, setIndicator] = useState<{
    height: number;
    left: number;
    top: number;
    width: number;
  }>();
  const activeNavigation = navigation.find(
    ({ to }) =>
      pathname === to || (to !== "/admin" && pathname.startsWith(`${to}/`)),
  );

  function handleAccountSwitch(token: string) {
    const account = savedAccounts.find((saved) => saved.token === token);
    if (!account) return;

    switchAccount(account);
    window.location.assign(account.role === "ADMIN" ? "/admin" : "/");
  }

  useLayoutEffect(() => {
    function updateIndicator() {
      const activeItem = activeNavigation
        ? itemRefs.current.get(activeNavigation.to)
        : undefined;

      if (!activeItem) {
        return;
      }

      setIndicator({
        height: activeItem.offsetHeight,
        left: activeItem.offsetLeft,
        top: activeItem.offsetTop,
        width: activeItem.offsetWidth,
      });
    }

    updateIndicator();
    window.addEventListener("resize", updateIndicator);

    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeNavigation]);

  return (
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="flex flex-col border-b border-border bg-card lg:min-h-svh lg:border-r lg:border-b-0">
        <div className="flex h-16 items-center justify-between px-5 lg:h-20">
          <Link aria-label="coHida — painel administrativo" to="/admin">
            <AppLogo variant="default" />
          </Link>
        </div>
        <nav
          aria-label="Navegação administrativa"
          className="relative flex gap-1 overflow-x-auto border-t border-border px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:block lg:border-0 lg:px-3 lg:py-3"
        >
          {indicator ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 z-0 rounded-lg bg-primary motion-safe:transition-[transform,width,height] motion-safe:duration-200 motion-safe:ease-out"
              style={{
                height: indicator.height,
                transform: `translate(${indicator.left}px, ${indicator.top}px)`,
                width: indicator.width,
              }}
            />
          ) : null}
          {navigation.map(({ icon: Icon, label, to }) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-lg p-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:w-auto sm:gap-2 sm:px-3 lg:mb-1 lg:w-full lg:justify-start lg:gap-3",
                  isActive &&
                    "text-primary-foreground hover:bg-transparent hover:text-primary-foreground",
                )
              }
              end={to === "/admin"}
              key={to}
              aria-label={label}
              ref={(element) => {
                if (element) {
                  itemRefs.current.set(to, element);
                }
              }}
              to={to}
            >
              <Icon aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur sm:px-8">
          <p className="text-sm text-muted-foreground">Operação coHida</p>
          <AccountMenu
            accountName={adminName}
            accounts={savedAccounts}
            showAddAccount
            ariaLabel="Menu da administradora"
            onSwitchAccount={handleAccountSwitch}
            trigger={<UserRound />}
          >
              <Button
                className="w-full justify-start"
                render={<Link to="/entrar" />}
                variant="ghost"
              >
                <LogOut />
                Sair
              </Button>
          </AccountMenu>
        </header>
        <main className="min-w-0 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}

export function BackToStoreButton() {
  return (
    <Button render={<Link to="/" />} size="sm" variant="ghost">
      <ChevronLeft aria-hidden="true" />
      Loja
    </Button>
  );
}
