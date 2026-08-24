import { Ticket } from "lucide-react";
import { Link } from "react-router";

import { PageContainer, StoreHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCommerce } from "@/data/useCommerce";
import { formatCurrency } from "@/lib/currency";

export function CouponsPage() {
  const { state } = useCommerce();
  return (
    <div className="min-h-svh bg-background">
      <StoreHeader />
      <PageContainer className="py-10 sm:py-14">
        <p className="text-sm font-medium text-primary">Minha conta</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Meus cupons
        </h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {state.coupons.map((coupon) => (
            <Card key={coupon.id}>
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Ticket className="size-5 text-primary" />
                    <p className="font-semibold">{coupon.code}</p>
                  </div>
                  <p className="mt-3 text-lg font-semibold">
                    {formatCurrency(coupon.valueCents)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {coupon.kind === "exchange"
                      ? "Cupom de troca"
                      : "Cupom promocional"}
                  </p>
                </div>
                <Badge variant={coupon.active ? "success" : "secondary"}>
                  {coupon.active ? "Ativo" : "Inativo"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button className="mt-8" render={<Link to="/produtos" />}>
          Usar em uma compra
        </Button>
      </PageContainer>
    </div>
  );
}
