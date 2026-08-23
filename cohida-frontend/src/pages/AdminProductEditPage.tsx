import { ChevronLeft } from "lucide-react";
import { Link, useParams } from "react-router";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProductForm } from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";
import { adminProducts } from "@/mocks";

export function AdminProductEditPage() {
  const { productId } = useParams();
  const product =
    adminProducts.find((item) => item.id === productId) ?? adminProducts[0];

  return (
    <AdminLayout>
      <Button
        render={<Link to={`/admin/produtos/${product.id}`} />}
        size="sm"
        variant="ghost"
      >
        <ChevronLeft aria-hidden="true" />
        {product.name}
      </Button>
      <div className="mt-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Editar produto
        </h1>
        <p className="mt-2 text-muted-foreground">
          Atualize os dados comerciais e técnicos de {product.name}.
        </p>
      </div>
      <div className="mt-8 max-w-4xl">
        <ProductForm product={product} />
      </div>
    </AdminLayout>
  );
}
