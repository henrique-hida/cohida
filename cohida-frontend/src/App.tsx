import { Navigate, Route, Routes } from 'react-router';

import { ChatbotFab } from '@/components/shared';
import { FormValidationNotice } from '@/components/shared/FormValidationNotice';
import { StorefrontLayout } from '@/components/shared/StorefrontLayout';
import { PlainPageLayout } from '@/components/shared/PlainPageLayout';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminCustomerCreatePage } from '@/pages/admin/AdminCustomerCreatePage';
import { AdminCustomerDetailPage } from '@/pages/admin/AdminCustomerDetailPage';
import { AdminCustomerEditPage } from '@/pages/admin/AdminCustomerEditPage';
import { AdminCustomersPage } from '@/pages/admin/AdminCustomersPage';
import { AdminProductCreatePage } from '@/pages/admin/AdminProductCreatePage';
import { AdminProductDetailPage } from '@/pages/admin/AdminProductDetailPage';
import { AdminProductEditPage } from '@/pages/admin/AdminProductEditPage';
import { AdminOrderDetailPage } from '@/pages/admin/AdminOrderDetailPage';
import { AdminExchangeDetailPage } from '@/pages/admin/AdminExchangeDetailPage';
import { AdminCouponsPage } from '@/pages/admin/AdminCouponsPage';
import { AdminCouponCreatePage } from '@/pages/admin/AdminCouponCreatePage';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage';
import { AdminAdministrationPage } from '@/pages/admin/AdminAdministrationPage';
import { AdminCategoryFormPage } from '@/pages/admin/AdminCategoryFormPage';
import { AdminResourcePage } from '@/pages/admin/AdminResourcePage';
import { AdminStockPage } from '@/pages/admin/AdminStockPage';
import { CatalogPage } from '@/pages/storefront/CatalogPage';
import { CartPage } from '@/pages/storefront/CartPage';
import { CheckoutPage } from '@/pages/storefront/CheckoutPage';
import { AuthPage } from '@/pages/storefront/AuthPage';
import { AccountPage } from '@/pages/storefront/AccountPage';
import { OrdersPage } from '@/pages/storefront/OrdersPage';
import { OrderDetailPage } from '@/pages/storefront/OrderDetailPage';
import { ExchangesPage } from '@/pages/storefront/ExchangesPage';
import { CouponsPage } from '@/pages/storefront/CouponsPage';
import { HomePage } from '@/pages/storefront/HomePage';
import { ProductDetailPage } from '@/pages/storefront/ProductDetailPage';

function App() {
  return (
    <>
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route element={<PlainPageLayout />}>
            <Route element={<HomePage />} path='/' />
            <Route element={<AuthPage />} path='/entrar' />
            <Route element={<HomePage />} path='*' />
          </Route>
          <Route
            element={<ProductDetailPage />}
            path='/produtos/:productSlug'
          />
          <Route element={<CatalogPage />} path='/produtos' />
          <Route element={<CheckoutPage />} path='/checkout' />
          <Route element={<AccountPage />} path='/conta' />
          <Route element={<CartPage />} path='/carrinho' />
          <Route element={<OrderDetailPage />} path='/pedidos/:orderId' />
          <Route element={<OrdersPage />} path='/pedidos' />
          <Route element={<ExchangesPage />} path='/trocas' />
          <Route element={<CouponsPage />} path='/cupons' />
        </Route>
        <Route
          element={<Navigate replace to='/entrar' />}
          path='/admin/login'
        />
        <Route element={<AdminLayout />}>
          <Route
            path='/admin/produtos'
            element={<AdminResourcePage resource='produtos' />}
          />
          <Route
            path='/admin/produtos/novo'
            element={<AdminProductCreatePage />}
          />
          <Route path='/admin/clientes' element={<AdminCustomersPage />} />
          <Route
            path='/admin/cupons/novo'
            element={<AdminCouponCreatePage />}
          />
          <Route path='/admin/cupons' element={<AdminCouponsPage />} />
          <Route path='/admin/estoque' element={<AdminStockPage />} />
          <Route path='/admin/analises' element={<AdminAnalyticsPage />} />
          <Route
            path='/admin/administracao'
            element={<AdminAdministrationPage />}
          />
          <Route
            path='/admin/pedidos'
            element={<AdminResourcePage resource='pedidos' />}
          />
          <Route
            path='/admin/trocas'
            element={<AdminResourcePage resource='trocas' />}
          />
          <Route
            path='/admin/administracao/nova'
            element={<AdminCategoryFormPage />}
          />
          <Route
            path='/admin/administracao/:id/editar'
            element={<AdminCategoryFormPage />}
          />
          <Route path='/admin' element={<AdminDashboardPage />} />
          <Route
            path='/admin/produtos/:productId/editar'
            element={<AdminProductEditPage />}
          />
          <Route
            path='/admin/clientes/novo'
            element={<AdminCustomerCreatePage />}
          />
          <Route
            path='/admin/clientes/:customerId/editar'
            element={<AdminCustomerEditPage />}
          />
          <Route
            path='/admin/produtos/:productId'
            element={<AdminProductDetailPage />}
          />
          <Route
            path='/admin/clientes/:customerId'
            element={<AdminCustomerDetailPage />}
          />
          <Route
            path='/admin/pedidos/:orderId'
            element={<AdminOrderDetailPage />}
          />
          <Route
            path='/admin/trocas/:exchangeId'
            element={<AdminExchangeDetailPage />}
          />
        </Route>
      </Routes>
      <ChatbotFab />
      <FormValidationNotice />
    </>
  );
}

export default App;
