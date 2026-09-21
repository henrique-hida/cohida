import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { customerApi, type CustomerResponse } from "@/lib/customerApi";

export function AdminCustomerDetailPage() {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState<CustomerResponse>();
  const [error, setError] = useState("");
  useEffect(() => {
    if (!customerId) {
      setError("Cliente inválido.");
      return;
    }
    setCustomer(undefined);
    setError("");
    customerApi
      .findById(customerId)
      .then(setCustomer)
      .catch((reason) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar o cliente.",
        );
      });
  }, [customerId]);
  async function deactivate() {
    if (!customer || !customer.active) return;
    if (!window.confirm("Excluir este cliente da lista ativa?")) return;
    try {
      await customerApi.deactivate(String(customer.id));
      setCustomer({ ...customer, active: false });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível excluir o cliente.",
      );
    }
  }
  if (error && !customer)
    return (
      <AdminLayout>
        <p className="text-destructive">{error}</p>
        <Button
          className="mt-4"
          render={<Link to="/admin/clientes" />}
          variant="outline"
        >
          Voltar para clientes
        </Button>
      </AdminLayout>
    );
  if (!customer) return <AdminLayout>Carregando cliente...</AdminLayout>;
  return (
    <AdminLayout>
      <Button render={<Link to="/admin/clientes" />} variant="ghost">
        Clientes
      </Button>
      <div className="mt-4 flex justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{customer.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {customer.code} · {customer.active ? "ATIVO" : "INATIVO"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            render={<Link to={`/admin/clientes/${customer.id}/editar`} />}
          >
            Editar
          </Button>
          {customer.active ? (
            <Button onClick={() => void deactivate()} variant="outline">
              Excluir
            </Button>
          ) : null}
        </div>
      </div>
      <section className="mt-8 rounded-xl border p-5">
        <p>E-mail: {customer.email}</p>
        <p>Telefone: {customer.phone}</p>
        <p>CPF: {customer.cpf}</p>
      </section>
      <section className="mt-4 rounded-xl border p-5">
        <h2 className="font-semibold">Endereços</h2>
        {customer.addresses.map((address) => (
          <p className="mt-3" key={address.id}>
            {address.type}: {address.street}, {address.number} · {address.city}/
            {address.state} · CEP {address.postalCode}
          </p>
        ))}
      </section>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
    </AdminLayout>
  );
}
