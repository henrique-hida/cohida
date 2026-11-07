import { Navigate, Route, Routes, useLocation } from "react-router";

import { ChatbotFab, StoreFooter } from "@/components/shared";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminCustomerCreatePage } from "@/pages/admin/AdminCustomerCreatePage";
import { AdminCustomerDetailPage } from "@/pages/admin/AdminCustomerDetailPage";
import { AdminCustomerEditPage } from "@/pages/admin/AdminCustomerEditPage";
import { AdminCustomersPage } from "@/pages/admin/AdminCustomersPage";
import { AdminProductCreatePage } from "@/pages/admin/AdminProductCreatePage";
import { AdminProductDetailPage } from "@/pages/admin/AdminProductDetailPage";
import { AdminProductEditPage } from "@/pages/admin/AdminProductEditPage";
import { AdminOrderDetailPage } from "@/pages/admin/AdminOrderDetailPage";
import { AdminExchangeDetailPage } from "@/pages/admin/AdminExchangeDetailPage";
import { AdminCouponsPage } from "@/pages/admin/AdminCouponsPage";
import { AdminCouponCreatePage } from "@/pages/admin/AdminCouponCreatePage";
import { AdminAnalyticsPage } from "@/pages/admin/AdminAnalyticsPage";
import { AdminAdministrationPage } from "@/pages/admin/AdminAdministrationPage";
import { AdminCategoryFormPage } from "@/pages/admin/AdminCategoryFormPage";
import { AdminResourcePage } from "@/pages/admin/AdminResourcePage";
import { AdminStockPage } from "@/pages/admin/AdminStockPage";
import { CatalogPage } from "@/pages/storefront/CatalogPage";
import { CartPage } from "@/pages/storefront/CartPage";
import { CheckoutPage } from "@/pages/storefront/CheckoutPage";
import { AuthPage } from "@/pages/storefront/AuthPage";
import { AccountPage } from "@/pages/storefront/AccountPage";
import { OrdersPage } from "@/pages/storefront/OrdersPage";
import { OrderDetailPage } from "@/pages/storefront/OrderDetailPage";
import { ExchangesPage } from "@/pages/storefront/ExchangesPage";
import { CouponsPage } from "@/pages/storefront/CouponsPage";
import { HomePage } from "@/pages/storefront/HomePage";
import { ProductDetailPage } from "@/pages/storefront/ProductDetailPage";

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
        <Route element={<AdminCouponCreatePage />} path="/admin/cupons/novo" />
        <Route element={<AdminCouponsPage />} path="/admin/cupons" />
        <Route element={<AdminStockPage />} path="/admin/estoque" />
        <Route element={<AdminAnalyticsPage />} path="/admin/analises" />
        <Route
          element={<AdminAdministrationPage />}
          path="/admin/administracao"
        />
        <Route
          element={<AdminCategoryFormPage />}
          path="/admin/administracao/nova"
        />
        <Route
          element={<AdminCategoryFormPage />}
          path="/admin/administracao/:id/editar"
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
