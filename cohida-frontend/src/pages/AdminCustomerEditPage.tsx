import { useParams } from "react-router";

import { AdminCustomerFormPage } from "@/pages/AdminCustomerCreatePage";
import { adminCustomers } from "@/mocks";

export function AdminCustomerEditPage() {
  const { customerId } = useParams();
  const customer =
    adminCustomers.find((item) => item.id === customerId) ?? adminCustomers[0];

  return <AdminCustomerFormPage customer={customer} />;
}
