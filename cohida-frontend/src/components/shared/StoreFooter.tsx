import { Link } from "react-router";

import { AppLogo } from "@/components/shared/AppLogo";

import { PageContainer } from "./PageContainer";

export function StoreFooter() {
  return (
    <footer className="border-t border-border bg-muted/35">
      <PageContainer className="grid gap-10 py-10 sm:grid-cols-[1.4fr_repeat(2,minmax(0,1fr))] sm:py-14">
        <div>
          <AppLogo className="dark:hidden" variant="dark" />
          <AppLogo className="hidden dark:block" variant="light" />
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            Equipamentos esportivos para acompanhar cada treino, desafio e
            conquista.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Comprar</h2>
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
            <Link className="hover:text-foreground" to="/produtos">
              Catálogo
            </Link>
            <Link className="hover:text-foreground" to="/carrinho">
              Carrinho
            </Link>
            <Link className="hover:text-foreground" to="/cupons">
              Cupons
            </Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Atendimento</h2>
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
            <Link className="hover:text-foreground" to="/trocas">
              Trocas e devoluções
            </Link>
            <a
              className="hover:text-foreground"
              href="mailto:contato@cohida.com"
            >
              contato@cohida.com
            </a>
            <Link className="hover:text-foreground" to="/conta">
              Minha conta
            </Link>
          </div>
        </div>
      </PageContainer>
      <div className="border-t border-border">
        <PageContainer className="flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} coHida. Todos os direitos reservados.
          </p>
          <p>Compra segura · Entrega para todo o Brasil</p>
        </PageContainer>
      </div>
    </footer>
  );
}
