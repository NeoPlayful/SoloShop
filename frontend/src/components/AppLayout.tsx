import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SiteHeader } from "./SiteHeader.js";

export function AppLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <SiteHeader sticky />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-surface-alt py-4 text-center text-sm text-text-tertiary">
        {t("store:allRightsReserved")}
      </footer>
    </div>
  );
}
