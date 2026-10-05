import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";

import { AdminDataState } from "@/components/admin/AdminDataState";
import { ChatbotFab, StoreFooter } from "@/components/shared";
import { AdminAdministrationPage } from "@/pages/AdminAdministrationPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { AdminCustomerCreatePage } from "@/pages/AdminCustomerCreatePage";
import { AdminCustomerDetailPage } from "@/pages/AdminCustomerDetailPage";
import { AdminCustomerEditPage } from "@/pages/AdminCustomerEditPage";
import { AdminCustomersPage } from "@/pages/AdminCustomersPage";
import { AdminProductCreatePage } from "@/pages/AdminProductCreatePage";
import { AdminProductDetailPage } from "@/pages/AdminProductDetailPage";
import { AdminProductEditPage } from "@/pages/AdminProductEditPage";
import { AdminOrderDetailPage } from "@/pages/AdminOrderDetailPage";
import { AdminExchangeDetailPage } from "@/pages/AdminExchangeDetailPage";
import { AdminCouponsPage } from "@/pages/AdminCouponsPage";
const AdminAnalyticsPage = lazy(() =>
  import("@/pages/AdminAnalyticsPage").then((module) => ({
    default: module.AdminAnalyticsPage,
  })),
);
import { AdminResourcePage } from "@/pages/AdminResourcePage";
import { AdminStockEntryPage } from "@/pages/AdminStockEntryPage";
import { AdminStockMovementsPage } from "@/pages/AdminStockMovementsPage";
import { CatalogPage } from "@/pages/CatalogPage";
import { CartPage } from "@/pages/CartPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { AuthPage } from "@/pages/AuthPage";
import { AccountPage } from "@/pages/AccountPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { OrderDetailPage } from "@/pages/OrderDetailPage";
import { ExchangesPage } from "@/pages/ExchangesPage";
import { CouponsPage } from "@/pages/CouponsPage";
import { HomePage } from "@/pages/HomePage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";

function App() {
  return (
    <>
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<CatalogPage />} path="/produtos" />
        <Route element={<ProductDetailPage />} path="/produtos/:productSlug" />
        <Route element={<CartPage />} path="/carrinho" />
        <Route element={<CheckoutPage />} path="/checkout" />
        <Route element={<AuthPage />} path="/entrar" />
        <Route element={<AccountPage />} path="/conta" />
        <Route element={<OrdersPage />} path="/pedidos" />
        <Route element={<OrderDetailPage />} path="/pedidos/:orderId" />
        <Route element={<ExchangesPage />} path="/trocas" />
        <Route element={<CouponsPage />} path="/cupons" />
        <Route
          element={<Navigate replace to="/entrar" />}
          path="/admin/login"
        />
        <Route element={<AdminDashboardPage />} path="/admin" />
        <Route
          element={<AdminResourcePage resource="produtos" />}
          path="/admin/produtos"
        />
        <Route
          element={<AdminProductCreatePage />}
          path="/admin/produtos/novo"
        />
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
        <Route
          element={<AdminStockEntryPage />}
          path="/admin/estoque/entrada"
        />
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
        <Route element={<AdminCustomersPage />} path="/admin/clientes" />
        <Route
          element={<AdminCustomerCreatePage />}
          path="/admin/clientes/novo"
        />
        <Route
          element={<AdminCustomerDetailPage />}
          path="/admin/clientes/:customerId"
        />
        <Route
          element={<AdminCustomerEditPage />}
          path="/admin/clientes/:customerId/editar"
        />
        <Route
          element={<AdminResourcePage resource="trocas" />}
          path="/admin/trocas"
        />
        <Route
          element={<AdminExchangeDetailPage />}
          path="/admin/trocas/:exchangeId"
        />
        <Route element={<AdminCouponsPage />} path="/admin/cupons" />
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
      <StorefrontFooter />
      <ChatbotFab />
    </>
  );
}

function StorefrontFooter() {
  const { pathname } = useLocation();

  return pathname.startsWith("/admin") ? null : <StoreFooter />;
}

export default App;
