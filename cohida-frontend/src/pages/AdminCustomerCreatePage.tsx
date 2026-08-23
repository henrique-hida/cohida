import { useState, type FormEvent } from "react";
import { Check, ChevronLeft, Save } from "lucide-react";
import { Link } from "react-router";

import { AddressFields } from "@/components/admin/AddressFields";
import {
  AdminFormField,
  adminInputClassName,
  adminSuccessNoticeClassName,
} from "@/components/admin/AdminFormField";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { adminCustomerFormOptions } from "@/mocks";

export function AdminCustomerCreatePage() {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password"));
    const confirmation = String(formData.get("passwordConfirmation"));
    const passwordIsValid =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!passwordIsValid) {
      setError(
        "A senha deve ter 8 caracteres, maiúscula, minúscula e símbolo.",
      );
      setSaved(false);
      return;
    }
    if (password !== confirmation) {
      setError("A confirmação de senha não corresponde à senha informada.");
      setSaved(false);
      return;
    }
    setError("");
    setSaved(true);
  }

  return (
    <AdminLayout>
      <Button render={<Link to="/admin/clientes" />} size="sm" variant="ghost">
        <ChevronLeft aria-hidden="true" />
        Clientes
      </Button>
      <div className="mt-4">
        <h1 className="text-3xl font-semibold tracking-tight">Novo cliente</h1>
        <p className="mt-2 text-muted-foreground">
          Cadastre os dados de contato e os endereços obrigatórios do cliente.
        </p>
      </div>
      <form className="mt-8 max-w-4xl space-y-6" onSubmit={submitForm}>
        {saved ? (
          <div className={adminSuccessNoticeClassName}>
            <Check className="size-5" />
            Cliente salvo apenas na interface. A persistência será conectada à
            API posteriormente.
          </div>
        ) : null}
        {error ? (
          <p
            className="rounded-lg bg-error p-3 text-sm text-error-foreground"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Dados pessoais e contato</CardTitle>
            <CardDescription>
              Os campos abaixo são necessários para criar o perfil do cliente.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <AdminFormField className="md:col-span-2" label="Nome completo">
              <input
                className={adminInputClassName}
                name="name"
                placeholder="Nome completo"
                required
              />
            </AdminFormField>
            <AdminFormField label="Gênero">
              <select
                className={adminInputClassName}
                defaultValue=""
                name="gender"
                required
              >
                <option disabled value="">
                  Selecione
                </option>
                {adminCustomerFormOptions.genders.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </AdminFormField>
            <AdminFormField label="Data de nascimento">
              <input
                className={adminInputClassName}
                name="birthDate"
                required
                type="date"
              />
            </AdminFormField>
            <AdminFormField label="CPF">
              <input
                className={adminInputClassName}
                inputMode="numeric"
                name="cpf"
                placeholder="000.000.000-00"
                required
              />
            </AdminFormField>
            <AdminFormField label="E-mail">
              <input
                autoComplete="email"
                className={adminInputClassName}
                name="email"
                placeholder="cliente@email.com"
                required
                type="email"
              />
            </AdminFormField>
            <AdminFormField label="Tipo de telefone">
              <select
                className={adminInputClassName}
                defaultValue=""
                name="phoneType"
                required
              >
                <option disabled value="">
                  Selecione
                </option>
                {adminCustomerFormOptions.phoneTypes.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </AdminFormField>
            <div className="grid grid-cols-[5rem_1fr] gap-3">
              <AdminFormField label="DDD">
                <input
                  className={adminInputClassName}
                  inputMode="numeric"
                  maxLength={2}
                  name="ddd"
                  placeholder="11"
                  required
                />
              </AdminFormField>
              <AdminFormField label="Número">
                <input
                  className={adminInputClassName}
                  inputMode="numeric"
                  name="phone"
                  placeholder="99999-9999"
                  required
                />
              </AdminFormField>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Senha de acesso</CardTitle>
            <CardDescription>
              Use no mínimo oito caracteres, com maiúscula, minúscula e
              caractere especial.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <AdminFormField label="Senha">
              <input
                autoComplete="new-password"
                className={adminInputClassName}
                minLength={8}
                name="password"
                required
                type="password"
              />
            </AdminFormField>
            <AdminFormField label="Confirmar senha">
              <input
                autoComplete="new-password"
                className={adminInputClassName}
                minLength={8}
                name="passwordConfirmation"
                required
                type="password"
              />
            </AdminFormField>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Endereço de cobrança</CardTitle>
            <CardDescription>
              É obrigatório manter ao menos um endereço de cobrança.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddressFields prefix="billing" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Endereço de entrega</CardTitle>
            <CardDescription>
              É obrigatório manter ao menos um endereço de entrega.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddressFields prefix="delivery" />
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button
            render={<Link to="/admin/clientes" />}
            type="button"
            variant="outline"
          >
            Cancelar
          </Button>
          <Button type="submit">
            <Save />
            Salvar cliente
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}
