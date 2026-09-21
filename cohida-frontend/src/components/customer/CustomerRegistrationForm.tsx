import { Eye, EyeOff } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { lookupCep } from "@/lib/cep";
import type { CustomerCreateInput } from "@/lib/customerApi";

type RegistrationInput = CustomerCreateInput;
type FieldErrors = Record<string, string>;

const inputClassName = (hasError: boolean, className = "") =>
  `h-9 rounded-md border bg-background px-3 ${
    hasError
      ? "border-destructive focus-visible:ring-destructive"
      : "border-input"
  } ${className}`;

function FieldError({ message }: { message?: string }) {
  return message ? (
    <span className="text-xs text-destructive">{message}</span>
  ) : null;
}

interface CustomerRegistrationFormProps {
  cancelAction?: ReactNode;
  compactActions?: boolean;
  includePassword?: boolean;
  initialValues?: Partial<RegistrationInput>;
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
  initialValue,
  prefix,
  title,
  fieldErrors,
}: {
  initialValue?: Partial<RegistrationInput["billingAddress"]>;
  prefix: "billing" | "delivery";
  title: string;
  fieldErrors: FieldErrors;
}) {
  const [cepError, setCepError] = useState("");
  const field = (name: string) => `${prefix}${name}`;

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
          aria-invalid={Boolean(fieldErrors[field("Label")])}
          className={inputClassName(Boolean(fieldErrors[field("Label")]))}
          defaultValue={
            initialValue?.label ?? (prefix === "billing" ? "Cobrança" : "Casa")
          }
          name={field("Label")}
          required
        />
        <FieldError message={fieldErrors[field("Label")]} />
      </label>
      <label className="grid gap-1 text-sm">
        CEP
        <input
          aria-invalid={Boolean(fieldErrors[field("PostalCode")] || cepError)}
          className={inputClassName(
            Boolean(fieldErrors[field("PostalCode")] || cepError),
          )}
          inputMode="numeric"
          name={field("PostalCode")}
          defaultValue={initialValue?.postalCode}
          onBlur={completeAddress}
          onInput={(event) => {
            event.currentTarget.value = formatCep(event.currentTarget.value);
          }}
          required
        />
        <FieldError message={fieldErrors[field("PostalCode")] || cepError} />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">
        Logradouro
        <input
          aria-invalid={Boolean(fieldErrors[field("Street")])}
          className={inputClassName(Boolean(fieldErrors[field("Street")]))}
          name={field("Street")}
          defaultValue={initialValue?.street}
          required
        />
        <FieldError message={fieldErrors[field("Street")]} />
      </label>
      <label className="grid gap-1 text-sm">
        Número
        <input
          aria-invalid={Boolean(fieldErrors[field("Number")])}
          className={inputClassName(Boolean(fieldErrors[field("Number")]))}
          name={field("Number")}
          defaultValue={initialValue?.number}
          required
        />
        <FieldError message={fieldErrors[field("Number")]} />
      </label>
      <label className="grid gap-1 text-sm">
        Bairro
        <input
          aria-invalid={Boolean(fieldErrors[field("Neighborhood")])}
          className={inputClassName(
            Boolean(fieldErrors[field("Neighborhood")]),
          )}
          name={field("Neighborhood")}
          defaultValue={initialValue?.neighborhood}
          required
        />
        <FieldError message={fieldErrors[field("Neighborhood")]} />
      </label>
      <label className="grid gap-1 text-sm">
        Cidade
        <input
          aria-invalid={Boolean(fieldErrors[field("City")])}
          className={inputClassName(Boolean(fieldErrors[field("City")]))}
          name={field("City")}
          defaultValue={initialValue?.city}
          required
        />
        <FieldError message={fieldErrors[field("City")]} />
      </label>
      <label className="grid gap-1 text-sm">
        Estado
        <input
          aria-invalid={Boolean(fieldErrors[field("State")])}
          className={inputClassName(Boolean(fieldErrors[field("State")]))}
          name={field("State")}
          defaultValue={initialValue?.state}
          required
        />
        <FieldError message={fieldErrors[field("State")]} />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">
        País
        <input
          aria-invalid={Boolean(fieldErrors[field("Country")])}
          className={inputClassName(Boolean(fieldErrors[field("Country")]))}
          defaultValue={initialValue?.country ?? "Brasil"}
          name={field("Country")}
          required
        />
        <FieldError message={fieldErrors[field("Country")]} />
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
    state: value("State"),
    street: value("Street"),
  };
}

function addressesMatch(
  billingAddress?: Partial<RegistrationInput["billingAddress"]>,
  deliveryAddress?: Partial<RegistrationInput["deliveryAddress"]>,
) {
  if (!billingAddress || !deliveryAddress) {
    return false;
  }

  const fields = [
    "street",
    "number",
    "neighborhood",
    "postalCode",
    "city",
    "state",
    "country",
  ] as const;
  const normalize = (value?: string) =>
    value?.trim().replaceAll(/\W/g, "").toLocaleLowerCase("pt-BR") ?? "";

  return fields.every(
    (field) =>
      normalize(billingAddress[field]) === normalize(deliveryAddress[field]),
  );
}

function errorStep(message: string) {
  const firstStepTerms = [
    "nome",
    "name",
    "e-mail",
    "email",
    "cpf",
    "telefone",
    "phone",
    "nascimento",
    "senha",
    "password",
  ];
  return firstStepTerms.some((term) => message.toLowerCase().includes(term))
    ? 1
    : 2;
}

function errorField(message: string) {
  const value = message.toLowerCase();
  if (value.includes("e-mail") || value.includes("email")) return "email";
  if (value.includes("cpf")) return "cpf";
  if (value.includes("telefone") || value.includes("phone")) return "phone";
  if (value.includes("nascimento")) return "birthDate";
  if (value.includes("nome") || value.includes("name")) return "name";
  if (value.includes("senha") || value.includes("password")) return "password";
  if (value.includes("cep") || value.includes("postal"))
    return "deliveryPostalCode";
  return undefined;
}

export function CustomerRegistrationForm({
  cancelAction,
  compactActions = false,
  includePassword = true,
  initialValues,
  onSubmit,
  submitLabel,
}: CustomerRegistrationFormProps) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useDeliveryForBilling, setUseDeliveryForBilling] = useState(
    () =>
      !initialValues?.billingAddress ||
      addressesMatch(
        initialValues.billingAddress,
        initialValues.deliveryAddress,
      ),
  );
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
            ...(includePassword ? ["password", "passwordConfirmation"] : []),
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
            ...(!useDeliveryForBilling
              ? [
                  "billingLabel",
                  "billingPostalCode",
                  "billingStreet",
                  "billingNumber",
                  "billingNeighborhood",
                  "billingCity",
                  "billingState",
                  "billingCountry",
                ]
              : []),
          ];
    const missing = required.filter(
      (name) => !String(new FormData(form).get(name) ?? "").trim(),
    );
    if (missing.length) {
      setFieldErrors(
        Object.fromEntries(missing.map((name) => [name, "Campo obrigatório."])),
      );
      setError("");
      return;
    }
    if (
      includePassword &&
      step === 1 &&
      String(new FormData(form).get("password")) !==
        String(new FormData(form).get("passwordConfirmation"))
    ) {
      setFieldErrors({
        passwordConfirmation: "A confirmação de senha não corresponde.",
      });
      setError("");
      return;
    }
    setError("");
    setFieldErrors({});
    setStep(2);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    if (
      includePassword &&
      password !== String(formData.get("passwordConfirmation") ?? "")
    ) {
      setFieldErrors({
        passwordConfirmation: "A confirmação de senha não corresponde.",
      });
      setError("");
      return;
    }
    if (
      includePassword &&
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}/.test(password)
    ) {
      setFieldErrors({
        password:
          "Use ao menos 8 caracteres, com maiúscula, minúscula e caractere especial.",
      });
      setError("");
      return;
    }
    setError("");
    setFieldErrors({});
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
        name: String(formData.get("name") ?? ""),
        password,
        passwordConfirmation: String(
          formData.get("passwordConfirmation") ?? "",
        ),
        phone: String(formData.get("phone") ?? ""),
      });
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : "Não foi possível concluir o cadastro.";
      const field = errorField(message);
      setFieldErrors(field ? { [field]: message } : {});
      setError(field ? "" : message);
      setStep(errorStep(message));
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
            aria-invalid={Boolean(fieldErrors.name)}
            className={inputClassName(Boolean(fieldErrors.name), "font-normal")}
            name="name"
            defaultValue={initialValues?.name}
            required
          />
          <FieldError message={fieldErrors.name} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          CPF
          <input
            aria-invalid={Boolean(fieldErrors.cpf)}
            className={inputClassName(Boolean(fieldErrors.cpf), "font-normal")}
            inputMode="numeric"
            name="cpf"
            defaultValue={initialValues?.cpf}
            onInput={(event) => {
              event.currentTarget.value = formatCpf(event.currentTarget.value);
            }}
            required
          />
          <FieldError message={fieldErrors.cpf} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Data de nascimento
          <input
            aria-invalid={Boolean(fieldErrors.birthDate)}
            className={inputClassName(
              Boolean(fieldErrors.birthDate),
              "font-normal",
            )}
            name="birthDate"
            defaultValue={initialValues?.birthDate}
            required
            type="date"
          />
          <FieldError message={fieldErrors.birthDate} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Telefone
          <input
            aria-invalid={Boolean(fieldErrors.phone)}
            className={inputClassName(
              Boolean(fieldErrors.phone),
              "font-normal",
            )}
            inputMode="tel"
            name="phone"
            defaultValue={initialValues?.phone}
            onInput={(event) => {
              event.currentTarget.value = formatPhone(
                event.currentTarget.value,
              );
            }}
            required
          />
          <FieldError message={fieldErrors.phone} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          E-mail
          <input
            aria-invalid={Boolean(fieldErrors.email)}
            className={inputClassName(
              Boolean(fieldErrors.email),
              "font-normal",
            )}
            name="email"
            defaultValue={initialValues?.email}
            required
            type="email"
          />
          <FieldError message={fieldErrors.email} />
        </label>
        {includePassword ? (
          <label className="grid gap-2 text-sm font-medium">
            Senha
            <span className="relative">
              <input
                aria-invalid={Boolean(fieldErrors.password)}
                className={inputClassName(
                  Boolean(fieldErrors.password),
                  "w-full pr-10 font-normal",
                )}
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
            <FieldError message={fieldErrors.password} />
          </label>
        ) : null}
        {includePassword ? (
          <label className="grid gap-2 text-sm font-medium sm:col-span-2">
            Confirmar senha
            <span className="relative">
              <input
                aria-invalid={Boolean(fieldErrors.passwordConfirmation)}
                className={inputClassName(
                  Boolean(fieldErrors.passwordConfirmation),
                  "w-full pr-10 font-normal",
                )}
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
            <FieldError message={fieldErrors.passwordConfirmation} />
          </label>
        ) : null}
      </div>
      <div className={step === 2 ? "space-y-4" : "hidden"}>
        <AddressFields
          initialValue={initialValues?.deliveryAddress}
          fieldErrors={fieldErrors}
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
            initialValue={initialValues?.billingAddress}
            fieldErrors={fieldErrors}
            prefix="billing"
            title="Endereço de cobrança"
          />
        ) : null}
      </div>
      {error ? (
        <Toast message={error} onClose={() => setError("")} variant="error" />
      ) : null}
      <div
        className={
          compactActions
            ? "mt-2 flex flex-wrap justify-end gap-2"
            : "mt-2 grid gap-2"
        }
      >
        {step > 1 ? (
          <Button
            className={compactActions ? "w-fit" : "w-full"}
            onClick={() => {
              setError("");
              setFieldErrors({});
              setStep(1);
            }}
            type="button"
            variant="outline"
          >
            Voltar
          </Button>
        ) : null}
        {cancelAction}
        {step === 1 ? (
          <Button
            className={compactActions ? "w-fit" : "w-full"}
            onClick={(event) => {
              event.preventDefault();
              const form = event.currentTarget.form;
              if (form) advance(form);
            }}
            size={compactActions ? "default" : "lg"}
            type="button"
          >
            Continuar
          </Button>
        ) : (
          <Button
            className={compactActions ? "w-fit" : "w-full"}
            disabled={isSubmitting}
            size={compactActions ? "default" : "lg"}
            type="submit"
          >
            {isSubmitting ? "Salvando..." : submitLabel}
          </Button>
        )}
      </div>
    </form>
  );
}
