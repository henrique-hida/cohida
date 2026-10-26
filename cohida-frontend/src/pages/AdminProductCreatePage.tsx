import { ChevronLeft } from "lucide-react";
import { Link } from "react-router";

import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { ProductForm } from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";

export function AdminProductCreatePage() {
  return (
    <AdminPageLayout
      action={
        <Button
          render={<Link to="/admin/produtos" />}
          size="sm"
          variant="outline"
        >
          <ChevronLeft aria-hidden="true" />
          Produtos
        </Button>
      }
      description="Cadastre um equipamento e defina seus dados comerciais."
      title="Novo produto"
    >
      <div className="mt-8 max-w-4xl">
        <ProductForm />
      </div>
    </AdminPageLayout>
  );
}
