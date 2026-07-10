import { useState, useRef, useEffect } from "react";
import { Link, Outlet, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SunIcon, MoonIcon, ChevronDownIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../theme/index.js";
import { apiClient } from "../lib/client.js";
import toast from "react-hot-toast";

export function AppLayout() {
  const { t, i18n } = useTranslation();
  const { resolved, toggle } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 获取当前用户
  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => apiClient.get("/auth/me").then((r) => r.data.data),
    retry: false,
    staleTime: 60_000,
  });

  // 检测 ?ref= 参数并存入 localStorage（推广来源追踪）
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("promo_ref", ref);
      fetch(`/api/public/promotion/${encodeURIComponent(ref)}/click`, { method: "POST" }).catch(() => {});
    }
  }, [searchParams]);

  const currentLang = i18n.language?.startsWith("zh") ? "zh-CN" : "en-US";

  const handleLangChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setLangOpen(false);
  };

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      toast.success(t("common:logout"));
      navigate("/");
    } catch {
      // ignore
    }
    setUserMenuOpen(false);
  };

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="border-b border-border bg-surface shadow-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-text-primary">
            <img src="/images/logo.png" alt="SoloShop" className="h-7 w-7" />
            {t("appName")}
          </Link>
          <nav className="flex items-center gap-3">
            <Link to="/" className="text-sm text-text-secondary hover:text-text-primary">{t("store:home")}</Link>
            <Link to="/order/query" className="text-sm text-text-secondary hover:text-text-primary">{t("store:orderQuery")}</Link>

            {/* 语言切换 */}
            <div ref={langRef} className="relative">
              <button onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-secondary hover:bg-surface-hover">
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

            {/* 主题切换 */}
            <button onClick={toggle} className="rounded p-1.5 text-text-secondary hover:bg-surface-hover" title={resolved === "dark" ? "Switch to light" : "Switch to dark"}>
              {resolved === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>

            {/* 用户状态 - 未登录（最右侧） */}
            {!user && (
              <>
                <Link to="/login" className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover transition-colors">
                  {t("common:login")}
                </Link>
                <Link to="/register" className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600 transition-colors">
                  {t("store:register")}
                </Link>
              </>
            )}

            {/* 用户状态 - 已登录（最右侧） */}
            {user && (
              <div ref={userMenuRef} className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover transition-colors">
                  <UserCircleIcon className="h-4 w-4" />
                  <span className="max-w-24 truncate">{user.email || user.username}</span>
                  <ChevronDownIcon className={`h-3 w-3 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-border bg-surface py-1 shadow-lg">
                    <Link
                      to="/promotion/apply"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover"
                    >
                      {t("store:applyPromoter")}
                    </Link>
                    {user.promotionInfo && (
                      <Link
                        to={`/promotion/${user.promotionInfo.referralCode}`}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover"
                      >
                        {t("store:promotionCenter")}
                      </Link>
                    )}
                    {(user.role === "admin" || user.role === "super_admin") && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover"
                      >
                        {t("admin:adminPanel")}
                      </Link>
                    )}
                    <hr className="my-1 border-border" />
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-surface-hover">
                      {t("common:logout")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-surface-alt py-4 text-center text-sm text-text-tertiary">
        {t("store:allRightsReserved")}
      </footer>
    </div>
  );
}
