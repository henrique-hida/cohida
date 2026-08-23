import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'

import { AppLogo, PageContainer, ThemeToggle } from '@/components/shared'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function AdminLoginPage() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border">
        <PageContainer className="flex h-18 items-center justify-between">
          <Link aria-label="coHida — início" to="/">
            <AppLogo className="dark:hidden" variant="dark" />
            <AppLogo className="hidden dark:block" variant="light" />
          </Link>
          <ThemeToggle />
        </PageContainer>
      </header>

      <PageContainer className="grid min-h-[calc(100svh-4.5rem)] place-items-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <span className="mb-3 grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <CardTitle className="text-2xl">Acesso administrativo</CardTitle>
            <CardDescription>
              Entre para gerenciar clientes, pedidos, estoque e análises.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="admin-email">E-mail</label>
                <input
                  autoComplete="email"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  id="admin-email"
                  name="email"
                  placeholder="admin@cohida.com"
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="admin-password">Senha</label>
                <input
                  autoComplete="current-password"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  id="admin-password"
                  name="password"
                  placeholder="Sua senha"
                  type="password"
                />
              </div>
              <Button className="w-full" type="submit">Entrar</Button>
            </form>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              A autenticação será conectada à API antes da área administrativa entrar em produção.
            </p>
            <Button className="mt-6 w-full" render={<Link to="/" />} variant="ghost">
              <ArrowLeft aria-hidden="true" />
              Voltar para a loja
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    </div>
  )
}
