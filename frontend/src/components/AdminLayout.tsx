import { Link, Outlet, useNavigate } from "react-router-dom";
import { apiClient } from "../api/client.js";

const navItems = [
  { path: "/admin", label: "仪表板", icon: "📊" },
  { path: "/admin/categories", label: "分类管理", icon: "📂" },
  { path: "/admin/products", label: "商品管理", icon: "📦" },
  { path: "/admin/cards", label: "卡密库存", icon: "🔑" },
  { path: "/admin/orders", label: "订单管理", icon: "📋" },
  { path: "/admin/payments", label: "支付管理", icon: "💰" },
  { path: "/admin/deliveries", label: "发货管理", icon: "🚚" },
  { path: "/admin/payment-channels", label: "支付渠道", icon: "🔌" },
  { path: "/admin/settings", label: "系统设置", icon: "⚙️" },
  { path: "/admin/logs", label: "操作日志", icon: "📝" },
  { path: "/admin/admins", label: "管理员", icon: "👤" },
];

export function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await apiClient.post("/auth/logout");
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="p-4 text-lg font-bold border-b border-gray-700">SoloShop 管理</div>
        <nav className="flex-1 overflow-y-auto p-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-gray-700 transition-colors">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={handleLogout} className="w-full rounded bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600 transition-colors">退出登录</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
