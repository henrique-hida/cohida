import type { ReactNode } from 'react'
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ClipboardList,
  LayoutDashboard,
  Package,
  Repeat2,
  UsersRound,
} from 'lucide-react'
import { Link, NavLink } from 'react-router'

import { AppLogo, ThemeToggle } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigation = [
  { icon: LayoutDashboard, label: 'Visão geral', to: '/admin' },
  { icon: Package, label: 'Produtos', to: '/admin/produtos' },
  { icon: Boxes, label: 'Estoque', to: '/admin/estoque' },
  { icon: ClipboardList, label: 'Pedidos', to: '/admin/pedidos' },
  { icon: UsersRound, label: 'Clientes', to: '/admin/clientes' },
  { icon: Repeat2, label: 'Trocas', to: '/admin/trocas' },
  { icon: BarChart3, label: 'Análises', to: '/admin/analises' },
]

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-border bg-card lg:min-h-svh lg:border-r lg:border-b-0">
        <div className="flex h-16 items-center justify-between px-5 lg:h-20">
          <Link aria-label="coHida — início" to="/">
            <AppLogo className="dark:hidden" variant="dark" />
            <AppLogo className="hidden dark:block" variant="light" />
          </Link>
          <span className="rounded-full bg-primary px-2 py-1 text-[11px] font-semibold tracking-wide text-primary-foreground uppercase">Admin</span>
        </div>
        <nav aria-label="Navegação administrativa" className="flex gap-1 overflow-x-auto border-t border-border px-3 py-3 lg:block lg:border-0 lg:px-3">
          {navigation.map(({ icon: Icon, label, to }) => (
            <NavLink
              className={({ isActive }) => cn(
                'flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:mb-1',
                isActive && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
              )}
              end={to === '/admin'}
              key={to}
              to={to}
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur sm:px-8">
          <p className="text-sm text-muted-foreground">Operação coHida</p>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="hidden text-right text-sm sm:block">
              <span className="block font-medium">Marina Costa</span>
              <span className="block text-xs text-muted-foreground">Administradora</span>
            </span>
            <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">MC</span>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-5 sm:p-8">{children}</main>
      </div>
    </div>
  )
}

export function BackToStoreButton() {
  return (
    <Button render={<Link to="/" />} size="sm" variant="ghost">
      <ChevronLeft aria-hidden="true" />
      Loja
    </Button>
  )
}
