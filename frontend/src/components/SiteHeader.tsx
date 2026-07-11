import { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { SunIcon, MoonIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../theme/index.js";
import { apiClient } from "../lib/client.js";

interface SiteHeaderProps {
  /** 是否使用 sticky 定位（商城前台用, 商家中心不需要） */
  sticky?: boolean;
  /** 商家中心链接地址, 默认根据登录状态自动判断 */
  merchantHref?: string;
}

export function SiteHeader({ sticky, merchantHref }: SiteHeaderProps) {
  const { t, i18n } = useTranslation();
  const { resolved, toggle } = useTheme();
  const [searchParams] = useSearchParams();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const { data: user } = useQuery({
    queryKey: ["me"],
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

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const finalMerchantHref = merchantHref ?? (user ? "/merchant" : "/login");

  return (
    <header
      className={`shrink-0 border-b border-border bg-surface shadow-sm ${
        sticky ? "sticky top-0 z-10" : ""
      }`}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-text-primary">
          <img src="/images/logo.png" alt="SoloShop" className="h-7 w-7" />
          SoloShop
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

          {/* 商家中心 */}
          <Link
            to={finalMerchantHref}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover transition-colors"
          >
            {t("store:merchantCenter")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
