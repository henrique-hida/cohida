import { KeyRound, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import { CustomerRegistrationForm } from "@/components/customer/CustomerRegistrationForm";
import { PageContainer, StoreHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCommerce } from "@/data/useCommerce";

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
    description: "Preencha seus dados para comprar e acompanhar seus pedidos.",
    title: "Crie sua conta",
  },
  recovery: {
    action: "Enviar link de recuperação",
    description: "O fluxo de recuperação será conectado ao backend.",
    title: "Recupere seu acesso",
  },
};

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register } = useCommerce();
  const navigate = useNavigate();
  const copy = authCopy[mode];

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "recovery") {
      setError("A recuperação de senha estará disponível com o backend.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    setError("");
    setIsSubmitting(true);
    try {
      await login(
        String(formData.get("email") ?? ""),
        String(formData.get("password") ?? ""),
      );
      navigate("/conta");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível concluir a operação.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-svh bg-muted/35">
      <StoreHeader />
      <PageContainer className="grid place-items-center py-10">
        <Card className="w-full max-w-3xl">
          <CardContent className="p-5 sm:p-6">
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
                  className={
                    mode === "login"
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "text-muted-foreground"
                  }
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  variant="ghost"
                >
                  Entrar
                </Button>
                <Button
                  className={
                    mode === "register"
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "text-muted-foreground"
                  }
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                  variant="ghost"
                >
                  Criar conta
                </Button>
              </div>
            ) : null}
            {mode === "register" ? (
              <CustomerRegistrationForm
                onSubmit={async (input) => {
                  await register(input);
                  navigate("/conta");
                }}
                submitLabel="Criar conta"
              />
            ) : (
              <form className="mt-5 grid gap-3" onSubmit={submitLogin}>
                <label className="grid gap-2 text-sm font-medium">
                  E-mail
                  <input
                    className="h-9 rounded-md border border-input bg-background px-3 font-normal"
                    name="email"
                    required
                    type="email"
                  />
                </label>
                {mode !== "recovery" ? (
                  <label className="grid gap-2 text-sm font-medium">
                    Senha
                    <input
                      className="h-9 rounded-md border border-input bg-background px-3 font-normal"
                      name="password"
                      required
                      type="password"
                    />
                  </label>
                ) : null}
                {error ? (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}
                <Button
                  className="mt-2 w-full"
                  disabled={isSubmitting}
                  size="lg"
                  type="submit"
                >
                  {isSubmitting ? "Salvando..." : copy.action}
                </Button>
              </form>
            )}
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
          </CardContent>
        </Card>
      </PageContainer>
    </div>
  );
}
