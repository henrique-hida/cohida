import { useState } from "react";
import { ChevronLeft, Pencil, Power } from "lucide-react";
import { Link, useParams } from "react-router";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProductDeactivationDialog } from "@/components/admin/ProductDeactivationDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { adminProductAuditEntries, adminProducts } from "@/mocks";

export function AdminProductDetailPage() {
  const { productId } = useParams();
  const [deactivationOpen, setDeactivationOpen] = useState(false);
  const product =
    adminProducts.find((item) => item.id === productId) ?? adminProducts[0];

  return (
    <AdminLayout>
      <Button render={<Link to="/admin/produtos" />} size="sm" variant="ghost">
        <ChevronLeft aria-hidden="true" />
        Produtos
      </Button>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <Badge
              variant={product.status === "ATIVO" ? "success" : "destructive"}
            >
              {product.status}
            </Badge>
          </div>
          <p className="mt-2 text-muted-foreground">
            {product.code} · {product.brand} · {product.barcode}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setDeactivationOpen(true)} variant="outline">
            <Power />
            Desativar
          </Button>
          <Button render={<Link to={`/admin/produtos/${product.id}/editar`} />}>
            <Pencil />
            Editar produto
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do produto</CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Categorias</p>
                <p className="mt-1 font-medium">
                  {product.categories.join(", ")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Grupo de precificação
                </p>
                <p className="mt-1 font-medium">{product.pricingGroup}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Preço de venda</p>
                <p className="mt-1 text-lg font-semibold">
                  {product.salePrice}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Custo unitário</p>
                <p className="mt-1 font-medium">{product.cost}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Características</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              {Object.entries(product.attributes).map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs capitalize text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-1 font-medium">{value}</p>
                </div>
              ))}
              <div className="col-span-2 sm:col-span-4">
                <p className="text-xs text-muted-foreground">Dimensões</p>
                <p className="mt-1 font-medium">
                  {product.dimensions.height} × {product.dimensions.width} ×{" "}
                  {product.dimensions.depth} cm · {product.dimensions.weight} kg
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estoque</CardTitle>
              <CardDescription>Visão atual de disponibilidade.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-success p-4 text-success-foreground">
                <p className="text-xs">Disponível</p>
                <p className="mt-1 text-2xl font-semibold">
                  {product.stock.available} un.
                </p>
              </div>
              <div className="rounded-lg bg-info p-4 text-info-foreground">
                <p className="text-xs">Reservado</p>
                <p className="mt-1 text-2xl font-semibold">
                  {product.stock.reserved} un.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Histórico de auditoria</CardTitle>
              <CardDescription>
                Dados demonstrativos até a integração com a API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {adminProductAuditEntries.map((entry) => (
                <div
                  className="border-l-2 border-primary pl-3"
                  key={entry.action}
                >
                  <p className="text-sm font-medium">{entry.action}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {entry.detail}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {entry.actor} · {entry.date}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      {deactivationOpen ? (
        <ProductDeactivationDialog
          onClose={() => setDeactivationOpen(false)}
          productName={product.name}
        />
      ) : null}
    </AdminLayout>
  );
}
