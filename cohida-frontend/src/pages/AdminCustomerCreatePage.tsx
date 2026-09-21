import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { CustomerRegistrationForm } from "@/components/customer/CustomerRegistrationForm";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import {
  customerApi,
  type CustomerAddressInput,
  type CustomerResponse,
} from "@/lib/customerApi";

type CustomerFormValues = Pick<
  CustomerResponse,
  "id" | "name" | "birthDate" | "cpf" | "phone" | "email"
> & {
  billingAddress?: CustomerAddressInput;
  deliveryAddress?: CustomerAddressInput;
};

export function AdminCustomerFormPage({
  customer,
}: {
  customer?: CustomerFormValues;
}) {
  const [successMessage, setSuccessMessage] = useState("");
  const isEditing = Boolean(customer);

  return (
    <AdminLayout>
      <Button render={<Link to="/admin/clientes" />} size="sm" variant="ghost">
        <ChevronLeft aria-hidden="true" />
        Clientes
      </Button>
      <div className="mt-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          {isEditing ? "Editar cliente" : "Novo cliente"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isEditing
            ? `Atualize os dados de ${customer?.name}.`
            : "Cadastre os dados do cliente."}
        </p>
      </div>
      <div className="max-w-3xl">
        <CustomerRegistrationForm
          cancelAction={
            <Button
              render={<Link to="/admin/clientes" />}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
          }
          compactActions
          includePassword={!isEditing}
          initialValues={customer}
          onSubmit={async (input) => {
            if (isEditing && customer) {
              const {
                cpf: _cpf,
                password: _password,
                passwordConfirmation: _passwordConfirmation,
                ...update
              } = input;
              await customerApi.update(String(customer.id), update);
            } else await customerApi.create(input);
            setSuccessMessage(
              isEditing
                ? "Alterações salvas com sucesso."
                : "Cliente salvo com sucesso.",
            );
          }}
          submitLabel={isEditing ? "Salvar alterações" : "Salvar cliente"}
        />
      </div>
      {successMessage ? (
        <Toast message={successMessage} onClose={() => setSuccessMessage("")} />
      ) : null}
    </AdminLayout>
  );
}

export function AdminCustomerCreatePage() {
  return <AdminCustomerFormPage />;
}
