import { Eye, EyeOff } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import type { RegisterCustomerInput } from "@/data/demoCommerceRepository";
import { lookupCep } from "@/lib/cep";

type RegistrationInput = RegisterCustomerInput;

interface CustomerRegistrationFormProps {
  onSubmit: (input: RegistrationInput) => Promise<void> | void;
  submitLabel: string;
}

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
          onBlur={completeAddress}
          onInput={(event) => {
            event.currentTarget.value = formatCep(event.currentTarget.value);
          }}
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

export function CustomerRegistrationForm({
  onSubmit,
  submitLabel,
}: CustomerRegistrationFormProps) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useDeliveryForBilling, setUseDeliveryForBilling] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);

  function advance(form: HTMLFormElement) {
    const required =
      step === 1
        ? [
            "name",
            "cpf",
            "birthDate",
            "phone",
            "email",
            "password",
            "passwordConfirmation",
          ]
        : [
            "deliveryLabel",
            "deliveryPostalCode",
            "deliveryStreet",
            "deliveryNumber",
            "deliveryNeighborhood",
            "deliveryCity",
            "deliveryState",
            "deliveryCountry",
          ];
    const missing = required.filter(
      (name) => !String(new FormData(form).get(name) ?? "").trim(),
    );
    if (missing.length) {
      setError("Preencha os campos obrigatórios para continuar.");
      return;
    }
    if (
      step === 1 &&
      String(new FormData(form).get("password")) !==
        String(new FormData(form).get("passwordConfirmation"))
    ) {
      setError("A confirmação de senha não corresponde.");
      return;
    }
    setError("");
    setStep(2);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    if (password !== String(formData.get("passwordConfirmation") ?? "")) {
      setError("A confirmação de senha não corresponde.");
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}/.test(password)) {
      setError(
        "Use ao menos 8 caracteres, com maiúscula, minúscula e caractere especial.",
      );
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const deliveryAddress = addressFrom(formData, "delivery");
      await onSubmit({
        billingAddress: useDeliveryForBilling
          ? { ...deliveryAddress, label: "Cobrança" }
          : addressFrom(formData, "billing"),
        birthDate: String(formData.get("birthDate") ?? ""),
        cpf: String(formData.get("cpf") ?? ""),
        deliveryAddress,
        email: String(formData.get("email") ?? ""),
        gender: "Não informado",
        name: String(formData.get("name") ?? ""),
        password,
        phone: String(formData.get("phone") ?? ""),
      });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível concluir o cadastro.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-5 grid gap-3" onSubmit={submit}>
      <div className={step === 1 ? "grid gap-3 sm:grid-cols-2" : "hidden"}>
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
              event.currentTarget.value = formatCpf(event.currentTarget.value);
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
        <label className="grid gap-2 text-sm font-medium">
          E-mail
          <input
            className="h-9 rounded-md border border-input bg-background px-3 font-normal"
            name="email"
            required
            type="email"
          />
        </label>
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
                isPasswordVisible ? "Ocultar senha" : "Visualizar senha"
              }
              className="absolute top-1/2 right-0 -translate-y-1/2"
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              {isPasswordVisible ? <EyeOff /> : <Eye />}
            </Button>
          </span>
        </label>
        <label className="grid gap-2 text-sm font-medium sm:col-span-2">
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
              onClick={() => setIsConfirmationVisible((visible) => !visible)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              {isConfirmationVisible ? <EyeOff /> : <Eye />}
            </Button>
          </span>
        </label>
      </div>
      <div className={step === 2 ? "space-y-4" : "hidden"}>
        <AddressFields prefix="delivery" title="Endereço de entrega" />
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
          <AddressFields prefix="billing" title="Endereço de cobrança" />
        ) : null}
      </div>
      {error ? (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <div className="mt-2 grid gap-2">
        {step > 1 ? (
          <Button
            className="w-full"
            onClick={() => {
              setError("");
              setStep(1);
            }}
            type="button"
            variant="outline"
          >
            Voltar
          </Button>
        ) : null}
        {step === 1 ? (
          <Button
            className="w-full"
            onClick={(event) => {
              const form = event.currentTarget.form;
              if (form) advance(form);
            }}
            size="lg"
            type="button"
          >
            Continuar
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={isSubmitting}
            size="lg"
            type="submit"
          >
            {isSubmitting ? "Salvando..." : submitLabel}
          </Button>
        )}
      </div>
    </form>
  );
}
