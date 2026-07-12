import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
  MegaphoneIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { apiClient } from "../lib/client.js";
import { useTheme } from "../theme/index.js";
import { SidebarLayout } from "../theme/components/layouts/SidebarLayout.js";
import { version } from "../../package.json";

const navGroups = [
  {
    label: "overview",
    items: [{ path: "/admin", label: "dashboard", icon: ChartBarSquareIcon }],
  },
  {
    label: "productMgmt",
    items: [
      { path: "/admin/categories", label: "categories", icon: FolderOpenIcon },
      { path: "/admin/products", label: "products", icon: CubeIcon },
      { path: "/admin/cards", label: "cards", icon: KeyIcon },
    ],
  },
  {
    label: "orderMgmt",
    items: [
      { path: "/admin/orders", label: "orders", icon: ClipboardDocumentListIcon },
      { path: "/admin/payments", label: "payments", icon: BanknotesIcon },
      { path: "/admin/deliveries", label: "deliveries", icon: TruckIcon },
      { path: "/admin/orders-logs", label: "orderLogTab", icon: DocumentTextIcon },
    ],
  },
  {
    label: "promotionGroup",
    items: [
      { path: "/admin/promotion", label: "promotionManagement", icon: MegaphoneIcon },
    ],
  },
  {
    label: "systemMgmt",
    items: [
      { path: "/admin/payment-channels", label: "paymentChannels", icon: BoltIcon },
      { path: "/admin/users", label: "users", icon: UserIcon },
      { path: "/admin/settings", label: "settings", icon: Cog6ToothIcon },
      { path: "/admin/logs", label: "logs", icon: DocumentTextIcon },
    ],
  },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("admin");
  const { resolved, toggle } = useTheme();
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const { data: user } = useQuery({
    queryKey: ["admin-me"],
    queryFn: () => apiClient.get("/auth/me").then((r) => r.data.data),
  });

  const { data: siteSettings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => apiClient.get("/admin/settings").then((r) => r.data.data),
    staleTime: 300_000,
  });

  const siteName = (siteSettings as any)?.site_name
    ? `${(siteSettings as any).site_name} ${t("adminPanelSuffix")}`
    : t("adminPanel");

  const handleLogout = async () => {
    await apiClient.post("/auth/logout");
    navigate("/admin/login");
  };

  const currentLang = i18n.language?.startsWith("zh") ? "zh-CN" : "en-US";
  const displayName = user?.username || "";

  const handleLangChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setLangOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sidebarFooter = (
    <div className="text-center text-xs text-gray-500">版本 v{version}</div>
  );

  return (
    <SidebarLayout
      title={siteName}
      navGroups={navGroups}
      sidebarFooter={sidebarFooter}
      renderItemLabel={(item) => t(item.label)}
      renderGroupLabel={(group) => t(group.label)}
    >
      {/* 顶部状态栏 */}
      <div className="sticky top-0 z-10 flex items-center justify-end gap-1 border-b border-border bg-page px-6 pt-4 pb-4">
        <div ref={langRef} className="relative">
          <button onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-secondary hover:bg-surface-hover transition-colors">
            {currentLang === "zh-CN" ? "简体中文" : "English"}
            <ChevronDownIcon className={`h-3 w-3 transition-transform ${langOpen ? "rotate-180" : ""}`} />
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-28 rounded-lg border border-border bg-surface py-1 shadow-lg">
              <button onClick={() => handleLangChange("zh-CN")} className={`flex w-full items-center justify-between px-3 py-1.5 text-xs ${currentLang === "zh-CN" ? "text-blue-500" : "text-text-secondary hover:bg-surface-hover"}`}>
                简体中文
                {currentLang === "zh-CN" && <span>✓</span>}
              </button>
              <button onClick={() => handleLangChange("en-US")} className={`flex w-full items-center justify-between px-3 py-1.5 text-xs ${currentLang === "en-US" ? "text-blue-500" : "text-text-secondary hover:bg-surface-hover"}`}>
                English
                {currentLang === "en-US" && <span>✓</span>}
              </button>
            </div>
          )}
        </div>
        <button onClick={toggle} className="rounded p-1.5 text-text-secondary hover:bg-surface-hover transition-colors" title={resolved === "dark" ? "Switch to light" : "Switch to dark"}>
          {resolved === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
        </button>
        <div ref={userRef} className="relative">
          <button onClick={() => setUserOpen(!userOpen)} className="flex items-center gap-1.5 rounded px-2 py-1 text-sm text-text-secondary hover:bg-surface-hover transition-colors">
            <UserIcon className="h-4 w-4" />
            <span>{displayName}</span>
            <ChevronDownIcon className={`h-3 w-3 transition-transform ${userOpen ? "rotate-180" : ""}`} />
          </button>
          {userOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-surface py-1 shadow-lg">
              <div className="px-3 py-1.5 text-xs text-text-secondary">{displayName}</div>
              <div className="border-t border-border" />
              <button onClick={handleLogout} className="flex w-full items-center px-3 py-1.5 text-xs text-red-500 hover:bg-surface-hover">
                {t("logout", { ns: "common" })}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 pt-4">
        <Outlet />
      </div>
    </SidebarLayout>
  );
}
