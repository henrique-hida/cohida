import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { AdminCustomerFormPage } from "@/pages/AdminCustomerCreatePage";
import { customerApi, type CustomerResponse } from "@/lib/customerApi";

export function AdminCustomerEditPage() {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState<CustomerResponse>();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!customerId) return;
    customerApi
      .findById(customerId)
      .then(setCustomer)
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar o cliente.",
        ),
      );
  }, [customerId]);

  if (error)
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

  const billingAddress = customer.addresses.find(
    (address) => address.type === "BILLING",
  );
  const deliveryAddress = customer.addresses.find(
    (address) => address.type === "DELIVERY",
  );

  return (
    <AdminCustomerFormPage
      customer={{ ...customer, billingAddress, deliveryAddress }}
    />
  );
}
