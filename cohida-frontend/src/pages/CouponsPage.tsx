import { Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/Pagination";
import { AccountSectionCard } from "@/components/shared/AccountSectionCard";
import { useCommerce } from "@/data/useCommerce";
import { formatCurrency } from "@/lib/currency";

export function CouponsPage() {
  return <Navigate replace to="/conta?secao=coupons" />;
}

export function CouponsSection() {
  const { loadCustomerCoupons, state } = useCommerce();
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(state.coupons.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const coupons = state.coupons.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    void loadCustomerCoupons();
  }, [loadCustomerCoupons]);

  return (
    <AccountSectionCard
      action={
        <Button render={<Link to="/produtos" />}>Usar em uma compra</Button>
      }
      description="Consulte seus cupons disponíveis e utilizados."
      title="Meus cupons"
    >
      {state.coupons.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {coupons.map((coupon) => (
            <article
              className="flex items-start justify-between gap-4 rounded-xl border border-border bg-background p-5"
              key={coupon.id}
            >
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
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Você ainda não tem cupons disponíveis.
        </p>
      )}
      <Pagination
        currentPage={currentPage}
        onPageChange={setPage}
        pageSize={pageSize}
        totalItems={state.coupons.length}
      />
    </AccountSectionCard>
  );
}
