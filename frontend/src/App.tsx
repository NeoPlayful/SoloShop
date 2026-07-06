import { Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import { AppLayout } from "./components/AppLayout.js";
import { AdminLayout } from "./components/AdminLayout.js";
import StorePage from "./pages/StorePage.js";
import ProductPage from "./pages/ProductPage.js";
import CheckoutPage from "./pages/CheckoutPage.js";
import OrderQueryPage from "./pages/OrderQueryPage.js";
import OrderDetailPage from "./pages/OrderDetailPage.js";
import LoginPage from "./pages/admin/LoginPage.js";
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
import LogsPage from "./pages/admin/LogsPage.js";
import AdminsPage from "./pages/admin/AdminsPage.js";

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
        </Route>

        {/* 后台管理 */}
        <Route path="/admin/login" element={<LoginPage />} />
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
          <Route path="logs" element={<LogsPage />} />
          <Route path="admins" element={<AdminsPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
