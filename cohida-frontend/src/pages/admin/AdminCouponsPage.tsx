import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router";

import { AdminDataState } from "@/components/admin/AdminDataState";
import { AdminFilterSelect } from "@/components/admin/AdminFilterSelect";
import { AdminListFiltersCard } from "@/components/admin/AdminListFiltersCard";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { useCommerce } from "@/data/useCommerce";

const pageSize = 10;

export function AdminCouponsPage() {
  const { loadCoupons, state, toggleCoupon } = useCommerce();
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const refreshCoupons = useCallback(() => {
    setLoading(true);
    void loadCoupons()
      .then(() => setLoadError(""))
      .catch((reason: unknown) =>
        setLoadError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar os cupons.",
        ),
      )
      .finally(() => setLoading(false));
  }, [loadCoupons]);

  useEffect(() => {
    const timer = window.setTimeout(refreshCoupons, 0);
    return () => window.clearTimeout(timer);
  }, [refreshCoupons]);

  const filteredCoupons = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return state.coupons
      .filter(
        (coupon) =>
          !term ||
          `${coupon.code} ${coupon.kind}`
            .toLocaleLowerCase("pt-BR")
            .includes(term),
      )
      .filter((coupon) => !kindFilter || coupon.kind === kindFilter)
      .filter(
        (coupon) =>
          !statusFilter ||
          (statusFilter === "ativos" && coupon.active) ||
          (statusFilter === "inativos" && !coupon.active),
      );
  }, [kindFilter, search, state.coupons, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredCoupons.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleCoupons = filteredCoupons.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  return (
    <AdminPageLayout
      action={
        <Button render={<Link to="/admin/cupons/novo" />}>
          <Plus aria-hidden="true" />
          Novo cupom
        </Button>
      }
      description="Gerencie cupons promocionais e créditos de troca."
      title="Cupons"
    >
      <div className="mt-8 grid gap-4">
        <AdminListFiltersCard>
          <AdminListToolbar
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchLabel="Pesquisar cupons"
            searchPlaceholder="Código do cupom"
            searchValue={search}
          >
            <AdminFilterSelect
              ariaLabel="Filtrar cupons por tipo"
              onValueChange={(value) => {
                setKindFilter(value);
                setPage(1);
              }}
              options={[
                { label: "Promocionais", value: "promotional" },
                { label: "Troca", value: "exchange" },
              ]}
              placeholder="Tipo"
              value={kindFilter}
            />
            <AdminFilterSelect
              ariaLabel="Filtrar cupons por situação"
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              options={[
                { label: "Ativos", value: "ativos" },
                { label: "Inativos", value: "inativos" },
              ]}
              placeholder="Situação"
              value={statusFilter}
            />
          </AdminListToolbar>
        </AdminListFiltersCard>
        <Card>
          <CardContent>
            {loading ? (
              <AdminDataState
                description="Consultando os cupons cadastrados."
                title="Carregando cupons"
                variant="loading"
              />
            ) : loadError ? (
              <AdminDataState
                action={
                  <Button onClick={refreshCoupons} variant="outline">
                    Tentar novamente
                  </Button>
                }
                description={loadError}
                title="Não foi possível carregar os cupons"
                variant="error"
              />
            ) : visibleCoupons.length ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[32rem] text-left text-sm">
                    <thead className="border-b border-border text-muted-foreground">
                      <tr>
                        <th className="pb-3">Código</th>
                        <th className="pb-3">Tipo</th>
                        <th className="pb-3">Valor</th>
                        <th className="pb-3">Situação</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {visibleCoupons.map((coupon) => (
                        <tr className="border-b border-border" key={coupon.id}>
                          <td className="py-4 font-medium">{coupon.code}</td>
                          <td className="py-4">
                            {coupon.kind === "exchange"
                              ? "Troca"
                              : "Promocional"}
                          </td>
                          <td className="py-4">
                            {formatCurrency(coupon.valueCents)}
                          </td>
                          <td className="py-4">
                            {coupon.active ? "Ativo" : "Inativo"}
                          </td>
                          <td className="py-4 text-right">
                            <Button
                              onClick={() => void toggleCoupon(coupon.id)}
                              size="sm"
                              variant="outline"
                            >
                              {coupon.active ? "Inativar" : "Ativar"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <AdminPagination
                  currentPage={safePage}
                  onPageChange={setPage}
                  pageSize={pageSize}
                  totalItems={filteredCoupons.length}
                />
              </>
            ) : (
              <AdminDataState
                description="Ajuste a busca ou os filtros para encontrar cupons."
                title="Nenhum cupom encontrado"
                variant="empty"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
