import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { Link, useParams } from "react-router";

import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { ProductForm } from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";
import { useCommerce } from "@/data/useCommerce";

export function AdminProductEditPage() {
  const { productId } = useParams();
  const { state, loadAdminProducts } = useCommerce();

  useEffect(() => {
    void loadAdminProducts();
  }, [loadAdminProducts]);

  const product = state.products.find((item) => item.id === productId);

  return (
    <AdminPageLayout
      action={
        product ? (
          <Button
            render={<Link to={`/admin/produtos/${product.id}`} />}
            size="sm"
            variant="outline"
          >
            <ChevronLeft />
            {product.name}
          </Button>
        ) : null
      }
      description="Atualize os dados, as variações e a disponibilidade do produto."
      title="Editar produto"
    >
      {product ? (
        <div className="mt-8 max-w-4xl">
          <ProductForm product={product} />
        </div>
      ) : (
        <p className="mt-8 text-muted-foreground">Carregando produto...</p>
      )}
    </AdminPageLayout>
  );
}
