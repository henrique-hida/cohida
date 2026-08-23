import { ChevronLeft } from "lucide-react";
import { Link } from "react-router";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { adminStockMovements } from "@/mocks";

export function AdminStockMovementsPage() {
  return (
    <AdminLayout>
      <Button render={<Link to="/admin/estoque" />} size="sm" variant="ghost">
        <ChevronLeft />
        Estoque
      </Button>
      <div className="mt-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Movimentações de estoque
        </h1>
        <p className="mt-2 text-muted-foreground">
          Entradas, vendas aprovadas, retornos de troca e responsável pela
          operação.
        </p>
      </div>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
          <CardDescription>
            Dados demonstrativos até a integração com a API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="pb-3">Data</th>
                <th className="pb-3">Produto</th>
                <th className="pb-3">Tipo</th>
                <th className="pb-3">Quantidade</th>
                <th className="pb-3">Responsável</th>
              </tr>
            </thead>
            <tbody>
              {adminStockMovements.map((movement) => (
                <tr
                  className="border-b border-border last:border-0"
                  key={`${movement.date}-${movement.product}`}
                >
                  <td className="py-4">{movement.date}</td>
                  <td className="py-4 font-medium">{movement.product}</td>
                  <td className="py-4">
                    <Badge
                      variant={
                        movement.type === "VENDA APROVADA" ? "info" : "success"
                      }
                    >
                      {movement.type}
                    </Badge>
                  </td>
                  <td className="py-4">{movement.quantity}</td>
                  <td className="py-4">{movement.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
