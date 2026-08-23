import { KeyRound, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { AppLogo, PageContainer, ThemeToggle } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type AuthMode = "login" | "register" | "recovery";

const authCopy: Record<
  AuthMode,
  { action: string; description: string; title: string }
> = {
  login: {
    action: "Entrar",
    description: "Acesse pedidos, endereços, cartões e recomendações.",
    title: "Que bom ter você de volta",
  },
  register: {
    action: "Criar conta",
    description: "Crie sua conta para acompanhar cada etapa dos seus pedidos.",
    title: "Sua jornada começa aqui",
  },
  recovery: {
    action: "Enviar link de recuperação",
    description: "Enviaremos um link seguro para você definir uma nova senha.",
    title: "Recupere seu acesso",
  },
};

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const copy = authCopy[mode];

  return (
    <div className="min-h-svh bg-muted/35">
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <PageContainer className="flex h-18 items-center justify-between">
          <Link aria-label="coHida — início" to="/">
            <AppLogo className="dark:hidden" variant="dark" />
            <AppLogo className="hidden dark:block" variant="light" />
          </Link>
          <ThemeToggle />
        </PageContainer>
      </header>
      <PageContainer className="grid min-h-[calc(100svh-4.5rem)] place-items-center py-10">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 sm:p-8">
            {isSubmitted ? (
              <div className="py-6 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Mail className="size-5" />
                </span>
                <h1 className="mt-5 text-2xl font-semibold">Tudo certo</h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {mode === "recovery"
                    ? "Se o e-mail estiver cadastrado, você receberá as instruções para recuperar sua senha."
                    : "Este é um fluxo demonstrativo. Sua conta estará disponível assim que o backend for conectado."}
                </p>
                <Button
                  className="mt-6"
                  onClick={() => setMode("login")}
                  render={<Link to="/conta" />}
                >
                  Ir para minha conta
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                    {mode === "recovery" ? (
                      <KeyRound className="size-5" />
                    ) : (
                      <UserRound className="size-5" />
                    )}
                  </span>
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                      {copy.title}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {copy.description}
                    </p>
                  </div>
                </div>
                {mode !== "recovery" ? (
                  <div className="mt-7 grid grid-cols-2 rounded-lg bg-muted p-1">
                    <Button
                      onClick={() => setMode("login")}
                      variant={mode === "login" ? "secondary" : "ghost"}
                    >
                      Entrar
                    </Button>
                    <Button
                      onClick={() => setMode("register")}
                      variant={mode === "register" ? "secondary" : "ghost"}
                    >
                      Criar conta
                    </Button>
                  </div>
                ) : null}
                <form
                  className="mt-6 grid gap-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setIsSubmitted(true);
                  }}
                >
                  {mode === "register" ? (
                    <label className="grid gap-2 text-sm font-medium">
                      Nome completo
                      <input
                        className="h-10 rounded-lg border border-input bg-background px-3 font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        placeholder="Como quer ser chamado?"
                        required
                      />
                    </label>
                  ) : null}
                  <label className="grid gap-2 text-sm font-medium">
                    E-mail
                    <input
                      className="h-10 rounded-lg border border-input bg-background px-3 font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      placeholder="voce@email.com"
                      required
                      type="email"
                    />
                  </label>
                  {mode !== "recovery" ? (
                    <label className="grid gap-2 text-sm font-medium">
                      Senha
                      <input
                        className="h-10 rounded-lg border border-input bg-background px-3 font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        minLength={8}
                        placeholder="Mínimo de 8 caracteres"
                        required
                        type="password"
                      />
                    </label>
                  ) : null}
                  {mode === "register" ? (
                    <label className="grid gap-2 text-sm font-medium">
                      Confirmar senha
                      <input
                        className="h-10 rounded-lg border border-input bg-background px-3 font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        minLength={8}
                        required
                        type="password"
                      />
                    </label>
                  ) : null}
                  <Button className="mt-2" size="lg" type="submit">
                    {copy.action}
                  </Button>
                </form>
                {mode === "login" ? (
                  <Button
                    className="mt-3 px-0"
                    onClick={() => setMode("recovery")}
                    variant="link"
                  >
                    Esqueci minha senha
                  </Button>
                ) : null}
                {mode === "recovery" ? (
                  <Button
                    className="mt-4 px-0"
                    onClick={() => setMode("login")}
                    variant="link"
                  >
                    Voltar para entrar
                  </Button>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </div>
  );
}
