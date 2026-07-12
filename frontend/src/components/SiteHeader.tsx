import { useState, useRef, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SunIcon, MoonIcon, ChevronDownIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../theme/index.js";
import { apiClient } from "../lib/client.js";

interface SiteHeaderProps {
  /** 是否使用 sticky 定位（商城前台用, 商家中心不需要） */
  sticky?: boolean;
  /** 商家中心链接地址, 默认根据登录状态自动判断 */
  merchantHref?: string;
  /** 是否在右侧显示用户登录状态（商家中心使用） */
  showUserStatus?: boolean;
}

export function SiteHeader({ sticky, merchantHref, showUserStatus }: SiteHeaderProps) {
  const { t, i18n } = useTranslation();
  const { resolved, toggle } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.get("/auth/me").then((r) => r.data.data),
    retry: false,
    staleTime: 60_000,
  });

  const { data: siteSettings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => apiClient.get("/public/settings").then((r) => r.data.data),
    staleTime: 300_000,
  });

  const siteName = (siteSettings as any)?.site_name || "SoloShop";

  // 检测 ?aff= 参数并存入 localStorage（推广来源追踪）
  useEffect(() => {
    const ref = searchParams.get("aff");
    if (ref) {
      localStorage.setItem("soloshop_promo_ref", ref);
      fetch(`/api/public/promotion/${encodeURIComponent(ref)}/click`, { method: "POST" }).catch(() => {});
    }
  }, [searchParams]);

  const currentLang = i18n.language?.startsWith("zh") ? "zh-CN" : "en-US";

  const handleLangChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setLangOpen(false);
  };

  // Esc 关闭抽屉 & 锁定背景滚动
  useEffect(() => {
    if (!drawerOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

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

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
      queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/");
    } catch {
      // 忽略错误
    }
  };

  const finalMerchantHref = merchantHref ?? (user ? "/merchant" : "/login");

  return (
    <header
      className={`shrink-0 border-b border-border bg-surface shadow-sm ${
        sticky ? "sticky top-0 z-10" : ""
      }`}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-text-primary">
          <img src="/images/logo.png" alt={siteName} className="h-7 w-7" />
          {siteName}
        </Link>
        <div className="flex items-center gap-1">
          <nav className="hidden md:flex items-center gap-3">
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

          {/* 商家中心 */}
          <Link
            to={finalMerchantHref}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover transition-colors"
          >
            {t("store:merchantCenter")}
          </Link>

          {/* 用户状态栏（商家中心使用） */}
          {showUserStatus && user && (
            <>
              <div className="mx-2 h-5 w-px shrink-0 bg-border" />
              <div ref={userMenuRef} className="relative">
                <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="max-w-28 truncate">{user.username}</span>
                <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-border bg-surface py-1 shadow-lg">
                  <Link
                    to="/merchant/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t("store:sidebarAccountSettings")}
                  </Link>
                  <hr className="my-1 border-border" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t("store:logout")}
                  </button>
                </div>
              )}
            </div>
            </>
          )}
        </nav>

          {/* 移动端：主题切换 + 汉堡按钮 */}
          <button onClick={toggle} className="md:hidden rounded p-1.5 text-text-secondary hover:bg-surface-hover" title={resolved === "dark" ? "Switch to light" : "Switch to dark"}>
            {resolved === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
          <button onClick={() => setDrawerOpen(true)} className="md:hidden rounded p-1.5 text-text-secondary hover:bg-surface-hover">
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* 移动端抽屉遮罩层 */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setDrawerOpen(false)} />
      )}

      {/* 移动端侧滑抽屉 */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-64 flex-col bg-surface shadow-xl transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* 抽屉头部 */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <span className="text-lg font-bold text-text-primary">{siteName}</span>
          <button onClick={() => setDrawerOpen(false)} className="rounded p-1.5 text-text-secondary hover:bg-surface-hover">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 抽屉导航链接 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-1">
            <Link
              to="/"
              onClick={() => setDrawerOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
            >
              {t("store:home")}
            </Link>
            <Link
              to="/order/query"
              onClick={() => setDrawerOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
            >
              {t("store:orderQuery")}
            </Link>
            <Link
              to={finalMerchantHref}
              onClick={() => setDrawerOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
            >
              {t("store:merchantCenter")}
            </Link>
          </div>

          {/* 分隔线 */}
          <hr className="my-4 border-border" />

          {/* 语言切换（抽屉内） */}
          <div className="space-y-1">
            <p className="px-3 text-xs text-text-tertiary">{t("store:language")}</p>
            <button
              onClick={() => { handleLangChange("zh-CN"); setDrawerOpen(false); }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                currentLang === "zh-CN" ? "text-blue-500" : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              }`}
            >
              简体中文
              {currentLang === "zh-CN" && <span>✓</span>}
            </button>
            <button
              onClick={() => { handleLangChange("en-US"); setDrawerOpen(false); }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                currentLang === "en-US" ? "text-blue-500" : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              }`}
            >
              English
              {currentLang === "en-US" && <span>✓</span>}
            </button>
          </div>

          {/* 用户状态（商家中心专用，抽屉内） */}
          {showUserStatus && user && (
            <>
              <hr className="my-4 border-border" />
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="max-w-36 truncate">{user.username}</span>
                </div>
                <Link
                  to="/merchant/settings"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t("store:sidebarAccountSettings")}
                </Link>
                <button
                  onClick={() => { handleLogout(); setDrawerOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t("store:logout")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
