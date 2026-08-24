import { ChevronLeft, Pencil, Power } from "lucide-react";
import { Link, useParams } from "react-router";

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
import { adminCustomers } from "@/mocks";
import { useCommerce } from "@/data/useCommerce";

export function AdminCustomerDetailPage() {
  const { state, toggleAdminCustomer } = useCommerce();
  const { customerId } = useParams();
  const customer =
    adminCustomers.find((item) => item.id === customerId) ?? adminCustomers[0];
  const isActive = state.adminCustomerActive[customer.id] ?? true;
  return (
    <AdminLayout>
      <Button render={<Link to="/admin/clientes" />} size="sm" variant="ghost">
        <ChevronLeft />
        Clientes
      </Button>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {customer.name}
            </h1>
            <Badge variant={isActive ? "success" : "destructive"}>
              {isActive ? "ATIVO" : "INATIVO"}
            </Badge>
          </div>
          <p className="mt-2 text-muted-foreground">
            {customer.code} · Perfil de compra: {customer.profile}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            render={<Link to={`/admin/clientes/${customer.id}/editar`} />}
          >
            <Pencil />
            Editar perfil
          </Button>
          <Button
            onClick={() => toggleAdminCustomer(customer.id)}
            variant="outline"
          >
            <Power />
            {isActive ? "Inativar" : "Reativar"}
          </Button>
        </div>
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">E-mail</p>
                <p className="mt-1 font-medium">{customer.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="mt-1 font-medium">{customer.phone}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Histórico de transações</CardTitle>
              <CardDescription>
                {customer.orders} pedido(s) registrado(s).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-input p-4 text-sm">
                <span className="font-medium">Último pedido</span>
                <span className="mt-1 block text-muted-foreground">
                  Pedido #COH-1048 · R$ 429,90 · EM PROCESSAMENTO
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Endereços</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg bg-muted p-3">
                <span className="font-medium">Cobrança</span>
                <span className="mt-1 block text-muted-foreground">
                  Rua das Palmeiras, 240 · Mogi das Cruzes, SP
                </span>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <span className="font-medium">Entrega preferida</span>
                <span className="mt-1 block text-muted-foreground">
                  Rua das Palmeiras, 240 · Mogi das Cruzes, SP
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cartões salvos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-input p-3 text-sm">
                <span className="font-medium">Visa final 2048</span>
                <span className="mt-1 block text-muted-foreground">
                  Cartão preferido · dados protegidos
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
