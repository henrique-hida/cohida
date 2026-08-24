import { Eye, EyeOff, KeyRound, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import { PageContainer, StoreHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCommerce } from "@/data/useCommerce";
import type { RegisterCustomerInput } from "@/data/demoCommerceRepository";
import { lookupCep } from "@/lib/cep";

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

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
}

function AddressFields({
  prefix,
  title,
}: {
  prefix: "billing" | "delivery";
  title: string;
}) {
  const [cepError, setCepError] = useState("");

  async function completeAddress(event: React.FocusEvent<HTMLInputElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    try {
      const address = await lookupCep(event.currentTarget.value);
      if (!address) return;
      const set = (name: string, value: string) => {
        const input = form.elements.namedItem(`${prefix}${name}`);
        if (input instanceof HTMLInputElement) input.value = value;
      };
      set("Street", address.street);
      set("Neighborhood", address.neighborhood);
      set("City", address.city);
      set("State", address.state);
      setCepError("");
    } catch (reason) {
      setCepError(reason instanceof Error ? reason.message : "CEP inválido.");
    }
  }

  return (
    <fieldset className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      <label className="grid gap-1 text-sm">
        Apelido
        <input
          className="h-9 rounded-md border border-input bg-background px-3"
          defaultValue={prefix === "billing" ? "Cobrança" : "Casa"}
          name={`${prefix}Label`}
          required
        />
      </label>
      <label className="grid gap-1 text-sm">
        CEP
        <input
          className="h-9 rounded-md border border-input bg-background px-3"
          inputMode="numeric"
          name={`${prefix}PostalCode`}
          onInput={(event) => {
            event.currentTarget.value = formatCep(event.currentTarget.value);
          }}
          onBlur={completeAddress}
          required
        />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">
        Logradouro
        <input
          className="h-9 rounded-md border border-input bg-background px-3"
          name={`${prefix}Street`}
          required
        />
      </label>
      {cepError ? (
        <p className="text-sm text-destructive sm:col-span-2">{cepError}</p>
      ) : null}
      <label className="grid gap-1 text-sm">
        Número
        <input
          className="h-9 rounded-md border border-input bg-background px-3"
          name={`${prefix}Number`}
          required
        />
      </label>
      <label className="grid gap-1 text-sm">
        Bairro
        <input
          className="h-9 rounded-md border border-input bg-background px-3"
          name={`${prefix}Neighborhood`}
          required
        />
      </label>
      <label className="grid gap-1 text-sm">
        Cidade
        <input
          className="h-9 rounded-md border border-input bg-background px-3"
          name={`${prefix}City`}
          required
        />
      </label>
      <label className="grid gap-1 text-sm">
        Estado
        <input
          className="h-9 rounded-md border border-input bg-background px-3"
          name={`${prefix}State`}
          required
        />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">
        País
        <input
          className="h-9 rounded-md border border-input bg-background px-3"
          defaultValue="Brasil"
          name={`${prefix}Country`}
          required
        />
      </label>
    </fieldset>
  );
}

function addressFrom(formData: FormData, prefix: "billing" | "delivery") {
  const value = (name: string) =>
    String(formData.get(`${prefix}${name}`) ?? "").trim();
  return {
    city: value("City"),
    country: value("Country"),
    label: value("Label"),
    neighborhood: value("Neighborhood"),
    number: value("Number"),
    postalCode: value("PostalCode"),
    residenceType: "Não informado",
    state: value("State"),
    street: value("Street"),
    streetType: "Logradouro",
  };
}

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useDeliveryForBilling, setUseDeliveryForBilling] = useState(true);
  const [registerStep, setRegisterStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const { login, register } = useCommerce();
  const navigate = useNavigate();
  const copy = authCopy[mode];

  function advanceRegisterStep(form: HTMLFormElement) {
    const fieldsByStep: Record<number, Array<[string, string]>> = {
      1: [
        ["name", "Nome completo"],
        ["cpf", "CPF"],
        ["birthDate", "Data de nascimento"],
        ["phone", "Telefone"],
        ["email", "E-mail"],
        ["password", "Senha"],
        ["passwordConfirmation", "Confirmação de senha"],
      ],
      2: [
        ["deliveryLabel", "Apelido do endereço"],
        ["deliveryPostalCode", "CEP"],
        ["deliveryStreet", "Logradouro"],
        ["deliveryNumber", "Número"],
        ["deliveryNeighborhood", "Bairro"],
        ["deliveryCity", "Cidade"],
        ["deliveryState", "Estado"],
        ["deliveryCountry", "País"],
      ],
    };
    const missing = fieldsByStep[registerStep].filter(
      ([name]) => !String(new FormData(form).get(name) ?? "").trim(),
    );
    fieldsByStep[registerStep].forEach(([name]) => {
      const field = form.elements.namedItem(name);
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLSelectElement
      )
        field.classList.remove(
          "border-destructive",
          "ring-1",
          "ring-destructive",
        );
    });
    missing.forEach(([name]) => {
      const field = form.elements.namedItem(name);
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLSelectElement
      )
        field.classList.add("border-destructive", "ring-1", "ring-destructive");
    });
    if (missing.length) {
      setFieldErrors(missing.map(([, label]) => label));
      setError("Corrija os campos destacados para continuar.");
      return;
    }
    if (
      registerStep === 1 &&
      String(new FormData(form).get("password") ?? "") !==
        String(new FormData(form).get("passwordConfirmation") ?? "")
    ) {
      setError("A confirmação de senha não corresponde.");
      return;
    }
    setError("");
    setFieldErrors([]);
    setRegisterStep((step) => Math.min(step + 1, 2));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "recovery") {
      setError("A recuperação de senha estará disponível com o backend.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    setError("");
    setIsSubmitting(true);
    try {
      if (mode === "login") await login(email, password);
      else {
        if (password !== String(formData.get("passwordConfirmation") ?? ""))
          throw new Error("A confirmação de senha não corresponde.");
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}/.test(password))
          throw new Error(
            "Use ao menos 8 caracteres, com maiúscula, minúscula e caractere especial.",
          );
        const deliveryAddress = addressFrom(formData, "delivery");
        await register({
          billingAddress: useDeliveryForBilling
            ? { ...deliveryAddress, label: "Cobrança" }
            : addressFrom(formData, "billing"),
          birthDate: String(formData.get("birthDate") ?? ""),
          cpf: String(formData.get("cpf") ?? ""),
          deliveryAddress,
          email,
          gender: String(formData.get("gender") ?? ""),
          name: String(formData.get("name") ?? ""),
          password,
          phone: String(formData.get("phone") ?? ""),
        } satisfies RegisterCustomerInput);
      }
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
                    setRegisterStep(1);
                    setError("");
                  }}
                  variant="ghost"
                >
                  Criar conta
                </Button>
              </div>
            ) : null}
            <form
              className="mt-5 grid gap-3"
              onInput={(event) => {
                const field = event.target;
                if (
                  field instanceof HTMLInputElement ||
                  field instanceof HTMLSelectElement
                )
                  field.classList.remove(
                    "border-destructive",
                    "ring-1",
                    "ring-destructive",
                  );
              }}
              onInvalid={(event) => {
                event.preventDefault();
                const field = event.target;
                const label =
                  field instanceof HTMLInputElement ||
                  field instanceof HTMLSelectElement
                    ? field.labels?.[0]?.textContent?.trim()
                    : undefined;
                if (
                  field instanceof HTMLInputElement ||
                  field instanceof HTMLSelectElement
                ) {
                  field.classList.add(
                    "border-destructive",
                    "ring-1",
                    "ring-destructive",
                  );
                }
                setFieldErrors(label ? [label] : []);
                setError("Corrija os campos destacados para continuar.");
              }}
              onSubmit={submit}
            >
              {mode === "register" ? (
                <div
                  className={`grid gap-3 sm:grid-cols-2 ${registerStep === 1 ? "" : "hidden"}`}
                >
                  <label className="grid gap-2 text-sm font-medium">
                    Nome completo
                    <input
                      className="h-9 rounded-md border border-input bg-background px-3 font-normal"
                      name="name"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    CPF
                    <input
                      className="h-9 rounded-md border border-input bg-background px-3 font-normal"
                      inputMode="numeric"
                      name="cpf"
                      onInput={(event) => {
                        event.currentTarget.value = formatCpf(
                          event.currentTarget.value,
                        );
                      }}
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Data de nascimento
                    <input
                      className="h-9 rounded-md border border-input bg-background px-3 font-normal"
                      name="birthDate"
                      required
                      type="date"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Telefone
                    <input
                      className="h-9 rounded-md border border-input bg-background px-3 font-normal"
                      inputMode="tel"
                      name="phone"
                      onInput={(event) => {
                        event.currentTarget.value = formatPhone(
                          event.currentTarget.value,
                        );
                      }}
                      required
                    />
                  </label>
                </div>
              ) : null}
              <div
                className={
                  mode === "register" && registerStep !== 1
                    ? "hidden"
                    : "contents"
                }
              >
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
                    <span className="relative">
                      <input
                        className="h-9 w-full rounded-md border border-input bg-background px-3 pr-10 font-normal"
                        minLength={8}
                        name="password"
                        required
                        type={isPasswordVisible ? "text" : "password"}
                      />
                      <Button
                        aria-label={
                          isPasswordVisible
                            ? "Ocultar senha"
                            : "Visualizar senha"
                        }
                        className="absolute top-1/2 right-0 -translate-y-1/2"
                        onClick={() =>
                          setIsPasswordVisible((visible) => !visible)
                        }
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        {isPasswordVisible ? <EyeOff /> : <Eye />}
                      </Button>
                    </span>
                  </label>
                ) : null}
                {mode === "register" ? (
                  <>
                    <label className="grid gap-2 text-sm font-medium">
                      Confirmar senha
                      <span className="relative">
                        <input
                          className="h-9 w-full rounded-md border border-input bg-background px-3 pr-10 font-normal"
                          minLength={8}
                          name="passwordConfirmation"
                          required
                          type={isConfirmationVisible ? "text" : "password"}
                        />
                        <Button
                          aria-label={
                            isConfirmationVisible
                              ? "Ocultar confirmação de senha"
                              : "Visualizar confirmação de senha"
                          }
                          className="absolute top-1/2 right-0 -translate-y-1/2"
                          onClick={() =>
                            setIsConfirmationVisible((visible) => !visible)
                          }
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          {isConfirmationVisible ? <EyeOff /> : <Eye />}
                        </Button>
                      </span>
                    </label>
                  </>
                ) : null}
              </div>
              {mode === "register" ? (
                <div className={registerStep === 2 ? "space-y-4" : "hidden"}>
                  <AddressFields
                    prefix="delivery"
                    title="Endereço de entrega"
                  />
                  <div className="rounded-lg border border-border bg-muted/35 p-3">
                    <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
                      <input
                        checked={useDeliveryForBilling}
                        className="size-4 accent-primary"
                        onChange={(event) =>
                          setUseDeliveryForBilling(event.target.checked)
                        }
                        type="checkbox"
                      />
                      Usar o endereço de entrega também para cobrança
                    </label>
                    <p className="mt-2 pl-7 text-xs text-muted-foreground">
                      Desmarque apenas se o endereço de cobrança for diferente.
                    </p>
                  </div>
                  {!useDeliveryForBilling ? (
                    <AddressFields
                      prefix="billing"
                      title="Endereço de cobrança"
                    />
                  ) : null}
                </div>
              ) : null}
              {error ? (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <p>{error}</p>
                  {fieldErrors.length ? (
                    <p className="mt-1 text-xs">
                      Pendentes: {fieldErrors.join(", ")}.
                    </p>
                  ) : null}
                </div>
              ) : null}
              {mode === "register" ? (
                <div className="mt-2 grid gap-2">
                  {registerStep > 1 ? (
                    <Button
                      className="w-full"
                      onClick={() => {
                        setError("");
                        setRegisterStep((step) => step - 1);
                      }}
                      type="button"
                      variant="outline"
                    >
                      Voltar
                    </Button>
                  ) : null}
                  {registerStep < 2 ? (
                    <Button
                      className="w-full"
                      onClick={(event) => {
                        const form = event.currentTarget.form;
                        if (form) advanceRegisterStep(form);
                      }}
                      size="lg"
                      type="button"
                    >
                      Continuar
                    </Button>
                  ) : null}
                </div>
              ) : null}
              {mode !== "register" || registerStep === 2 ? (
                <Button
                  className={mode === "register" ? "w-full" : "mt-2 w-full"}
                  disabled={isSubmitting}
                  size="lg"
                  type="submit"
                >
                  {isSubmitting ? "Salvando..." : copy.action}
                </Button>
              ) : null}
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
          </CardContent>
        </Card>
      </PageContainer>
    </div>
  );
}
