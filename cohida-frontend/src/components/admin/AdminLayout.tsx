import {
  useEffect,
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
  DatabaseZap,
  House,
  Ticket,
  Trash2,
  LayoutDashboard,
  Package,
  Repeat2,
  Settings,
  LogOut,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Link, Navigate, NavLink, useLocation } from "react-router";

import { AppLogo, ThemeToggle } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { useCommerce } from "@/data/useCommerce";
import { apiRequest, hasAdminSession } from "@/lib/customerApi";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const { pathname } = useLocation();
  const { loadAdminProducts } = useCommerce();
  const itemRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [demoPopulated, setDemoPopulated] = useState<boolean | null>(null);
  const [isUpdatingDemo, setIsUpdatingDemo] = useState(false);
  const [notice, setNotice] = useState<{
    message: string;
    variant: "error" | "success";
  }>();
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

  useEffect(() => {
    let cancelled = false;

    void apiRequest<{ populated: boolean }>("/admin/demo/seed")
      .then(({ populated }) => {
        if (!cancelled) setDemoPopulated(populated);
      })
      .catch(() => {
        if (!cancelled)
          setNotice({
            message: "Não foi possível verificar os dados demonstrativos.",
            variant: "error",
          });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleDemoPopulation() {
    if (demoPopulated === null) return;

    const remove = demoPopulated;
    setIsUpdatingDemo(true);
    try {
      await apiRequest<void>("/admin/demo/seed", {
        method: remove ? "DELETE" : "POST",
      });
      await loadAdminProducts();
      setDemoPopulated(!remove);
      setNotice({
        message: remove
          ? "Dados demonstrativos removidos."
          : "Dados demonstrativos carregados.",
        variant: "success",
      });
    } catch (reason) {
      setNotice({
        message:
          reason instanceof Error
            ? reason.message
            : "Não foi possível atualizar os dados demonstrativos.",
        variant: "error",
      });
    } finally {
      setIsUpdatingDemo(false);
    }
  }

  return (
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="flex flex-col border-b border-border bg-card lg:min-h-svh lg:border-r lg:border-b-0">
        <div className="flex h-16 items-center justify-between px-5 lg:h-20">
          <Link aria-label="coHida — painel administrativo" to="/admin">
            <AppLogo className="dark:hidden" variant="dark" />
            <AppLogo className="hidden dark:block" variant="light" />
          </Link>
          <span className="rounded-full bg-primary px-2 py-1 text-[11px] font-semibold tracking-wide text-primary-foreground uppercase">
            Admin
          </span>
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
        <div className="px-3 pb-3 lg:mt-auto lg:pb-5">
          <Button
            className="w-full justify-start"
            render={<Link to="/" />}
            variant="outline"
          >
            <House aria-hidden="true" />
            Ir para home
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur sm:px-8">
          <p className="text-sm text-muted-foreground">Operação coHida</p>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  aria-label="Menu da administradora"
                  size="icon"
                  variant="outline"
                />
              }
            >
              <UserRound />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 gap-1 p-2">
              <p className="px-2 pt-1 font-medium">{adminName}</p>
              <p className="px-2 text-xs text-muted-foreground">
                Administradora
              </p>
              <div className="mt-1 flex items-center justify-between border-t border-border px-2 pt-2">
                <span className="text-sm text-muted-foreground">Tema</span>
                <ThemeToggle />
              </div>
              <Button
                className="w-full justify-start"
                disabled={demoPopulated === null || isUpdatingDemo}
                onClick={() => void toggleDemoPopulation()}
                variant="ghost"
              >
                {demoPopulated ? <Trash2 /> : <DatabaseZap />}
                {demoPopulated ? "Remover demo" : "Carregar demo"}
              </Button>
              <Button
                className="w-full justify-start"
                render={<Link to="/entrar" />}
                variant="ghost"
              >
                <LogOut />
                Sair
              </Button>
            </PopoverContent>
          </Popover>
        </header>
        <main className="mx-auto max-w-7xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 p-5 sm:p-8">
          {children}
        </main>
      </div>
      {notice ? (
        <Toast
          message={notice.message}
          onClose={() => setNotice(undefined)}
          variant={notice.variant}
        />
      ) : null}
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
