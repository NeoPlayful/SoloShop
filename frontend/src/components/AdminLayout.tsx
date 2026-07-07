import { Outlet, useNavigate } from "react-router-dom";
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
import { useTheme } from "../theme/index.js";
import { SidebarLayout } from "../theme/components/layouts/SidebarLayout.js";

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

  const sidebarFooter = (
    <div className="flex items-center justify-between">
      <div className="flex gap-1">
        <button onClick={toggleLang} className="rounded bg-gray-700 px-2 py-1 text-xs hover:bg-gray-600 transition-colors" title="Switch Language">
          {i18n.language?.startsWith("zh") ? "EN" : "中"}
        </button>
        <button onClick={toggle} className="rounded bg-gray-700 p-1.5 hover:bg-gray-600 transition-colors" title={resolved === "dark" ? "Switch to light" : "Switch to dark"}>
          {resolved === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
        </button>
      </div>
      <button onClick={handleLogout} className="rounded bg-gray-700 px-3 py-2 text-xs hover:bg-gray-600 transition-colors">
        {t("logout", { ns: "common" })}
      </button>
    </div>
  );

  return (
    <SidebarLayout
      title={t("adminPanel")}
      navItems={navItems}
      sidebarFooter={sidebarFooter}
      renderNavLabel={(item) => t(item.label)}
    >
      <Outlet />
    </SidebarLayout>
  );
}
