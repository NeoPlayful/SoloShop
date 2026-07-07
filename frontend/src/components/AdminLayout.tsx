import { Link, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChartBarSquareIcon,
  FolderOpenIcon,
  CubeIcon,
  KeyIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  TruckIcon,
  BoltIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";
import { apiClient } from "../lib/client.js";
import { useTheme } from "../contexts/ThemeContext.js";

const navItems = [
  { path: "/admin", label: "dashboard", icon: ChartBarSquareIcon },
  { path: "/admin/categories", label: "categories", icon: FolderOpenIcon },
  { path: "/admin/products", label: "products", icon: CubeIcon },
  { path: "/admin/cards", label: "cards", icon: KeyIcon },
  { path: "/admin/orders", label: "orders", icon: ClipboardDocumentListIcon },
  { path: "/admin/payments", label: "payments", icon: BanknotesIcon },
  { path: "/admin/deliveries", label: "deliveries", icon: TruckIcon },
  { path: "/admin/payment-channels", label: "paymentChannels", icon: BoltIcon },
  { path: "/admin/settings", label: "settings", icon: Cog6ToothIcon },
  { path: "/admin/logs", label: "logs", icon: DocumentTextIcon },
  { path: "/admin/admins", label: "admins", icon: UserIcon },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("admin");
  const { resolved, toggle } = useTheme();

  const handleLogout = async () => {
    await apiClient.post("/auth/logout");
    navigate("/admin/login");
  };

  const toggleLang = () => {
    const next = i18n.language?.startsWith("zh") ? "en-US" : "zh-CN";
    i18n.changeLanguage(next);
  };

  return (
    <div className="flex min-h-screen bg-page">
      <aside className="w-56 bg-sidebar text-text-inverse flex flex-col">
        <div className="border-b border-gray-700 p-4 text-lg font-bold">{t("adminPanel")}</div>
        <nav className="flex-1 overflow-y-auto p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-sidebar-hover transition-colors">
                <Icon className="h-5 w-5 shrink-0" />
                <span>{t(item.label)}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-700 p-3 flex items-center justify-between">
          <div className="flex gap-1">
            <button onClick={toggleLang} className="rounded bg-gray-700 px-2 py-1 text-xs hover:bg-gray-600 transition-colors" title="Switch Language">
              {i18n.language?.startsWith("zh") ? "EN" : "中"}
            </button>
            <button onClick={toggle} className="rounded bg-gray-700 p-1.5 hover:bg-gray-600 transition-colors" title={resolved === "dark" ? "Switch to light" : "Switch to dark"}>
              {resolved === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            </button>
          </div>
          <button onClick={handleLogout} className="rounded bg-gray-700 px-3 py-2 text-xs hover:bg-gray-600 transition-colors">{t("logout", { ns: "common" })}</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
