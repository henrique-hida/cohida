import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";

import { AdminDataState } from "@/components/admin/AdminDataState";
import { AdminLoginPage } from "@/pages/AdminLoginPage";
import { AdminAdministrationPage } from "@/pages/AdminAdministrationPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { AdminCustomerCreatePage } from "@/pages/AdminCustomerCreatePage";
import { AdminCustomerDetailPage } from "@/pages/AdminCustomerDetailPage";
import { AdminProductCreatePage } from "@/pages/AdminProductCreatePage";
import { AdminProductDetailPage } from "@/pages/AdminProductDetailPage";
import { AdminProductEditPage } from "@/pages/AdminProductEditPage";
import { AdminOrderDetailPage } from "@/pages/AdminOrderDetailPage";
import { AdminExchangeDetailPage } from "@/pages/AdminExchangeDetailPage";
const AdminAnalyticsPage = lazy(() =>
  import("@/pages/AdminAnalyticsPage").then((module) => ({
    default: module.AdminAnalyticsPage,
  })),
);
import { AdminResourcePage } from "@/pages/AdminResourcePage";
import { AdminStockEntryPage } from "@/pages/AdminStockEntryPage";
import { AdminStockMovementsPage } from "@/pages/AdminStockMovementsPage";
import { HomePage } from "@/pages/HomePage";

function App() {
  return (
    <Routes>
      <Route element={<HomePage />} path="/" />
      <Route element={<AdminLoginPage />} path="/admin/login" />
      <Route element={<AdminDashboardPage />} path="/admin" />
      <Route
        element={<AdminResourcePage resource="produtos" />}
        path="/admin/produtos"
      />
      <Route element={<AdminProductCreatePage />} path="/admin/produtos/novo" />
      <Route
        element={<AdminProductDetailPage />}
        path="/admin/produtos/:productId"
      />
      <Route
        element={<AdminProductEditPage />}
        path="/admin/produtos/:productId/editar"
      />
      <Route
        element={<AdminResourcePage resource="estoque" />}
        path="/admin/estoque"
      />
      <Route element={<AdminStockEntryPage />} path="/admin/estoque/entrada" />
      <Route
        element={<AdminStockMovementsPage />}
        path="/admin/estoque/movimentacoes"
      />
      <Route
        element={<AdminResourcePage resource="pedidos" />}
        path="/admin/pedidos"
      />
      <Route
        element={<AdminOrderDetailPage />}
        path="/admin/pedidos/:orderId"
      />
      <Route
        element={<AdminResourcePage resource="clientes" />}
        path="/admin/clientes"
      />
      <Route
        element={<AdminCustomerCreatePage />}
        path="/admin/clientes/novo"
      />
      <Route
        element={<AdminCustomerDetailPage />}
        path="/admin/clientes/:customerId"
      />
      <Route
        element={<AdminResourcePage resource="trocas" />}
        path="/admin/trocas"
      />
      <Route
        element={<AdminExchangeDetailPage />}
        path="/admin/trocas/:exchangeId"
      />
      <Route
        element={
          <Suspense
            fallback={
              <AdminDataState
                description="Carregando o painel de desempenho..."
                title="Carregando análises"
                variant="loading"
              />
            }
          >
            <AdminAnalyticsPage />
          </Suspense>
        }
        path="/admin/analises"
      />
      <Route
        element={<AdminAdministrationPage />}
        path="/admin/administracao"
      />
      <Route element={<HomePage />} path="*" />
    </Routes>
  );
}

export default App;
