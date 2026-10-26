import { useEffect, useState } from "react";
import { ChevronLeft, Pencil, Power } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";

import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCommerce } from "@/data/useCommerce";
import { formatCurrency } from "@/lib/currency";

export function AdminProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { state, loadAdminProducts, setProductStatus } = useCommerce();
  const [error, setError] = useState("");

  useEffect(() => {
    void loadAdminProducts().catch((cause: Error) => setError(cause.message));
  }, [loadAdminProducts]);

  const product = state.products.find((item) => item.id === productId);

  async function deactivate() {
    if (!product) return;
    try {
      await setProductStatus(product.id, "inactive");
      navigate("/admin/produtos");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Não foi possível desativar.",
      );
    }
  }

  if (!product) {
    return (
      <AdminPageLayout
        description={
          error
            ? "Não foi possível abrir os dados deste produto."
            : "Consulte os dados comerciais, as categorias e as variações do produto."
        }
        title="Produto"
      >
        <p className={error ? "text-destructive" : "text-muted-foreground"}>
          {error || "Carregando produto..."}
        </p>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      action={
        <div className="flex flex-wrap gap-2">
          <Button
            render={<Link to="/admin/produtos" />}
            size="sm"
            variant="outline"
          >
            <ChevronLeft />
            Produtos
          </Button>
          <Button onClick={() => void deactivate()} size="sm" variant="outline">
            <Power />
            Desativar
          </Button>
          <Button
            render={<Link to={`/admin/produtos/${product.id}/editar`} />}
            size="sm"
          >
            <Pencil />
            Editar
          </Button>
        </div>
      }
      description={`${product.sku} · ${product.brand}`}
      title={product.name}
    >
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {error ? (
          <p className="text-destructive md:col-span-2">{error}</p>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>{product.description}</p>
            <p>Categorias: {product.categoryIds.join(", ")}</p>
            <Badge
              variant={product.status === "active" ? "success" : "destructive"}
            >
              {product.status === "active" ? "Ativo" : "Inativo"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Variações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {product.variants.map((variant) => (
              <div className="flex justify-between" key={variant.id}>
                <span>
                  {variant.label} · {variant.sku}
                </span>
                <span>
                  {variant.stockQuantity} un. ·{" "}
                  {formatCurrency(variant.priceCents ?? product.priceCents)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
