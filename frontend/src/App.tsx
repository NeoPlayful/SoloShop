import { Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import { AppLayout } from "./components/AppLayout.js";
import { AdminLayout } from "./components/AdminLayout.js";
import StorePage from "./pages/StorePage.js";
import ProductPage from "./pages/ProductPage.js";
import CheckoutPage from "./pages/CheckoutPage.js";
import OrderQueryPage from "./pages/OrderQueryPage.js";
import OrderDetailPage from "./pages/OrderDetailPage.js";
import AdminLoginPage from "./pages/admin/LoginPage.js";
import DashboardPage from "./pages/admin/DashboardPage.js";
import CategoriesPage from "./pages/admin/CategoriesPage.js";
import ProductsPage from "./pages/admin/ProductsPage.js";
import ProductEditPage from "./pages/admin/ProductEditPage.js";
import CardsPage from "./pages/admin/CardsPage.js";
import OrdersPage from "./pages/admin/OrdersPage.js";
import PaymentsPage from "./pages/admin/PaymentsPage.js";
import DeliveriesPage from "./pages/admin/DeliveriesPage.js";
import PaymentChannelsPage from "./pages/admin/PaymentChannelsPage.js";
import SettingsPage from "./pages/admin/SettingsPage.js";
import EmailSettingsPage from "./pages/admin/EmailSettingsPage.js";
import LogsPage from "./pages/admin/LogsPage.js";
import UsersPage from "./pages/admin/UsersPage.js";
import PromotionPage from "./pages/admin/PromotionPage.js";
import PromotionOrdersPage from "./pages/admin/PromotionOrdersPage.js";
import WithdrawalRequestsPage from "./pages/admin/WithdrawalRequestsPage.js";
import MerchantLayout from "./pages/merchant/MerchantLayout.js";
import MerchantOverview from "./pages/merchant/MerchantOverview.js";
import MerchantPromotionLink from "./pages/merchant/MerchantPromotionLink.js";
import MerchantPromotionOrders from "./pages/merchant/MerchantPromotionOrders.js";
import MerchantSettings from "./pages/merchant/MerchantSettings.js";
import MerchantWithdrawal from "./pages/merchant/MerchantWithdrawal.js";
import PromotionStatsPage from "./pages/PromotionStatsPage.js";
import RegisterPage from "./pages/RegisterPage.js";
import LoginPage from "./pages/LoginPage.js";

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* 前台商城 */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<StorePage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/checkout/:orderNo" element={<CheckoutPage />} />
          <Route path="/order/:orderNo" element={<OrderDetailPage />} />
          <Route path="/order/query" element={<OrderQueryPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/promotion/apply" element={<Navigate to="/merchant" replace />} />
          <Route path="/promotion/:code" element={<PromotionStatsPage />} />
        </Route>

        {/* 商家中心 */}
        <Route path="/merchant" element={<MerchantLayout />}>
          <Route index element={<Navigate to="/merchant/overview" replace />} />
          <Route path="overview" element={<MerchantOverview />} />
          <Route path="promotion-link" element={<MerchantPromotionLink />} />
          <Route path="promotion-orders" element={<MerchantPromotionOrders />} />
          <Route path="settings" element={<MerchantSettings />} />
          <Route path="withdrawal" element={<MerchantWithdrawal />} />
        </Route>

        {/* 后台管理 */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductEditPage />} />
          <Route path="products/new" element={<ProductEditPage />} />
          <Route path="cards" element={<CardsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="payment-channels" element={<PaymentChannelsPage />} />
          <Route path="deliveries" element={<DeliveriesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="email-settings" element={<EmailSettingsPage />} />
          <Route path="promotion" element={<PromotionPage />} />
          <Route path="orders-logs" element={<PromotionOrdersPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="withdrawal-requests" element={<WithdrawalRequestsPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
