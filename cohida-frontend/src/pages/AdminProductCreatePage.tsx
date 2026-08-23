import { ChevronLeft } from "lucide-react";
import { Link } from "react-router";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProductForm } from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";

export function AdminProductCreatePage() {
  return (
    <AdminLayout>
      <Button render={<Link to="/admin/produtos" />} size="sm" variant="ghost">
        <ChevronLeft aria-hidden="true" />
        Produtos
      </Button>
      <div className="mt-4">
        <h1 className="text-3xl font-semibold tracking-tight">Novo produto</h1>
        <p className="mt-2 text-muted-foreground">
          Cadastre um equipamento e defina seus dados comerciais.
        </p>
      </div>
      <div className="mt-8 max-w-4xl">
        <ProductForm />
      </div>
    </AdminLayout>
  );
}
