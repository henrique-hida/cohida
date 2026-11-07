import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Button } from "@/components/ui/button";
import { customerApi, type CustomerResponse } from "@/lib/customerApi";

export function AdminCustomerDetailPage() {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState<CustomerResponse>();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!customerId) {
        setError("Cliente inválido.");
        return;
      }
      setCustomer(undefined);
      setError("");
      customerApi
        .findById(customerId)
        .then((nextCustomer) => active && setCustomer(nextCustomer))
        .catch((reason) => {
          if (!active) return;
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar o cliente.",
          );
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
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
      <AdminPageLayout
        description="Não foi possível abrir os dados deste cliente."
        title="Cliente"
      >
        <p className="text-destructive">{error}</p>
        <Button
          className="mt-4"
          render={<Link to="/admin/clientes" />}
          variant="outline"
        >
          Voltar para clientes
        </Button>
      </AdminPageLayout>
    );
  if (!customer)
    return (
      <AdminPageLayout
        description="Consulte os dados de contato e endereços do cliente."
        title="Cliente"
      >
        Carregando cliente...
      </AdminPageLayout>
    );
  return (
    <AdminPageLayout
      action={
        <div className="flex flex-wrap gap-2">
          <Button
            render={<Link to="/admin/clientes" />}
            size="sm"
            variant="outline"
          >
            Clientes
          </Button>
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
      }
      description={`${customer.code} · ${customer.active ? "ATIVO" : "INATIVO"}`}
      title={customer.name}
    >
      <section className="rounded-xl border p-5">
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
    </AdminPageLayout>
  );
}
