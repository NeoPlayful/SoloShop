import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../theme/index.js";

export function AppLayout() {
  const { t, i18n } = useTranslation();
  const { resolved, toggle } = useTheme();

  const toggleLang = () => {
    const next = i18n.language?.startsWith("zh") ? "en-US" : "zh-CN";
    i18n.changeLanguage(next);
  };

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="border-b border-border bg-surface shadow-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="text-lg font-bold text-text-primary">{t("appName")}</Link>
          <nav className="flex items-center gap-3">
            <Link to="/" className="text-sm text-text-secondary hover:text-text-primary">{t("store:home")}</Link>
            <Link to="/order/query" className="text-sm text-text-secondary hover:text-text-primary">{t("store:orderQuery")}</Link>
            <button onClick={toggleLang} className="rounded border border-border px-2 py-1 text-xs text-text-secondary hover:bg-surface-hover" title="Switch Language">
              {i18n.language?.startsWith("zh") ? "EN" : "中"}
            </button>
            <button onClick={toggle} className="rounded p-1.5 text-text-secondary hover:bg-surface-hover" title={resolved === "dark" ? "Switch to light" : "Switch to dark"}>
              {resolved === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
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
